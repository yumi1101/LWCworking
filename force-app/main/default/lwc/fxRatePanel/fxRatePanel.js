import { LightningElement } from 'lwc';
import getLatestRate from '@salesforce/apex/FxRateService.getLatestRate';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const DEBOUNCE_MS = 300;
const DEFAULT_BASE = 'USD';
const DEFAULT_QUOTE = 'JPY';

const CURRENCY_OPTIONS = [
    { label: 'USD', value: 'USD' },
    { label: 'JPY', value: 'JPY' },
    { label: 'EUR', value: 'EUR' },
    { label: 'GBP', value: 'GBP' },
    { label: 'AUD', value: 'AUD' },
    { label: 'CAD', value: 'CAD' },
    { label: 'CHF', value: 'CHF' },
    { label: 'CNY', value: 'CNY' },
    { label: 'HKD', value: 'HKD' },
    { label: 'SGD', value: 'SGD' },
    { label: 'NZD', value: 'NZD' },
    { label: 'SEK', value: 'SEK' },
    { label: 'NOK', value: 'NOK' },
    { label: 'DKK', value: 'DKK' },
    { label: 'KRW', value: 'KRW' },
    { label: 'INR', value: 'INR' },
    { label: 'MXN', value: 'MXN' },
    { label: 'BRL', value: 'BRL' },
    { label: 'ZAR', value: 'ZAR' }
];

export default class FxRatePanel extends LightningElement {
    // 初期選択（初回表示時のデフォルト）
    baseCcy = DEFAULT_BASE;
    quoteCcy = DEFAULT_QUOTE;
    amountInput = '';

    // 取得した最新値（表示用に保持）
    rate;
    rateDate;
    convertedAmount;

    // UI状態（ローディングと連打抑止用）
    loading = false;
    lastFetchAt = 0;

    get currencyOptions() {
        return CURRENCY_OPTIONS;
    }

    get hasResult() {
        return this.rate !== undefined && this.rate !== null;
    }

    get amountValue() {
        if (this.amountInput === '' || this.amountInput === null || this.amountInput === undefined) {
            return null;
        }
        const parsed = Number(this.amountInput);
        return Number.isNaN(parsed) ? null : parsed;
    }

    get hasAmount() {
        return this.amountValue !== null;
    }

    get isFetchDisabled() {
        return this.loading;
    }

    get rateDisplay() {
        if (!this.hasResult) return '';
        const rateStr = this.formatNumber(this.rate, this.quoteCcy);
        return `1 ${this.baseCcy} = ${rateStr} ${this.quoteCcy}`;
    }

    get convertedDisplay() {
        if (!this.hasResult || !this.hasAmount) return '';
        const left = this.formatNumber(this.amountValue, this.baseCcy);
        const right = this.formatNumber(this.convertedAmount, this.quoteCcy);
        return `${left} ${this.baseCcy} = ${right} ${this.quoteCcy}`;
    }

    handleBaseChange(e) {
        this.baseCcy = e.detail.value;
    }

    handleQuoteChange(e) {
        this.quoteCcy = e.detail.value;
    }

    handleAmountChange(e) {
        this.amountInput = e.target.value;
    }

    handleClear() {
        this.baseCcy = DEFAULT_BASE;
        this.quoteCcy = DEFAULT_QUOTE;
        this.amountInput = '';
        this.rate = undefined;
        this.rateDate = undefined;
        this.convertedAmount = undefined;
    }

    async handleFetch() {
        // 連打対策の簡易デバウンス
        const now = Date.now();
        if (now - this.lastFetchAt < DEBOUNCE_MS) {
            return;
        }
        this.lastFetchAt = now;

        const validation = this.validateInputs();
        if (!validation.ok) {
            this.toast('入力エラー', validation.message, 'error');
            return;
        }

        this.loading = true;
        try {
            // Apexを呼び出して最新レートと換算結果（任意）を取得
            const result = await getLatestRate({
                baseCcy: this.baseCcy,
                quoteCcy: this.quoteCcy,
                amountOpt: this.amountValue
            });
            this.rate = result.rate;
            this.rateDate = result.rateDate;
            this.convertedAmount = result.convertedAmount;
        } catch (err) {
            this.toast('取得に失敗しました', this.errorMessage(err), 'error');
        } finally {
            this.loading = false;
        }
    }

    validateInputs() {
        // 事前バリデーション（不正入力はApex呼び出し前に弾く）
        if (!this.baseCcy || !this.quoteCcy) {
            return { ok: false, message: '通貨を選択してください。' };
        }
        if (this.baseCcy === this.quoteCcy) {
            return { ok: false, message: '基軸通貨と相手通貨は同一にできません。' };
        }
        if (this.amountValue !== null && this.amountValue <= 0) {
            return { ok: false, message: '金額は0より大きい値を入力してください。' };
        }
        return { ok: true };
    }

    formatNumber(value, ccy) {
        if (value === null || value === undefined) return '';
        // 表示桁の簡易制御（JPYは小数を抑え、その他は2〜4桁）
        const { min, max } = this.fractionDigitsFor(ccy);
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: min,
            maximumFractionDigits: max
        }).format(value);
    }

    fractionDigitsFor(ccy) {
        if (ccy === 'JPY') {
            return { min: 0, max: 2 };
        }
        return { min: 2, max: 4 };
    }

    toast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }

    errorMessage(err) {
        if (!err) return '不明なエラー';
        // Apexの例外形式（AuraHandledException）を優先して表示
        if (err.body && err.body.message) return err.body.message;
        return err.message || '不明なエラー';
    }
}
