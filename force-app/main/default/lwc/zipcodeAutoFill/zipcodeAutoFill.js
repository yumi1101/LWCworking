import { LightningElement, api, track } from 'lwc';
import lookup from '@salesforce/apex/ZipcodeLookupService.lookup';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const DEBOUNCE_MS = 400;

export default class ZipcodeAutoFill extends LightningElement {
    @api postal = '';
    @track prefecture = '';
    @track city = '';
    @track town = '';
    @track street = '';

    loading = false;
    timer;
    options = [];
    selectedKey;

    get hasOptions() {
        return this.options && this.options.length > 1;
    }

    // 親へ変更通知（Recordフォーム連携や独自処理用）
    notifyChange() {
        this.dispatchEvent(new CustomEvent('addresschange', {
            detail: {
                postal: this.postalSanitized,
                prefecture: this.prefecture,
                city: this.city,
                town: this.town,
                street: this.street,
                full: `${this.prefecture}${this.city}${this.town}${this.street || ''}`
            },
            bubbles: true,
            composed: true
        }));
    }

    get postalSanitized() {
        return (this.postal || '').replace(/[^0-9]/g, '');
    }

    handlePostalChange(e) {
        this.postal = e.target.value;
        // 7桁になったらデバウンス検索
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            if (this.postalSanitized.length === 7) {
                this.search();
            } else {
                this.options = [];
                this.selectedKey = undefined;
            }
        }, DEBOUNCE_MS);
    }

    async search() {
        this.loading = true;
        try {
            const results = await lookup({ zipcode: this.postal });
            if (!results || results.length === 0) {
                this.toast('見つかりませんでした', '該当する住所がありません。', 'warning');
                return;
            }
            // optionsに変換（keyはインデックス）
            this.options = results.map((r, idx) => ({
                label: `${r.full}（${r.zipcode}）`,
                value: String(idx),
                dto: r
            }));
            // 単一候補なら即反映
            if (this.options.length === 1) {
                this.applyDto(this.options[0].dto);
            } else {
                this.selectedKey = this.options[0].value;
                this.applyDto(this.options[0].dto);
            }
        } catch (err) {
            this.toast('検索に失敗しました', this.errorMessage(err), 'error');
        } finally {
            this.loading = false;
        }
    }

    handleSelect(e) {
        this.selectedKey = e.detail.value;
        const opt = this.options.find(o => o.value === this.selectedKey);
        if (opt) this.applyDto(opt.dto);
    }

    handleManualEdit(e) {
        const field = e.target.dataset.field;
        const val = e.target.value || '';
        this[field] = val;
        this.notifyChange();
    }

    applyDto(dto) {
        this.prefecture = dto.prefecture || '';
        this.city       = dto.city || '';
        this.town       = dto.town || '';
        // 町域まで自動、丁目以降は手入力
        this.notifyChange();
    }

    toast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }

    errorMessage(err) {
        if (!err) return '不明なエラー';
        if (err.body && err.body.message) return err.body.message;
        return err.message || '不明なエラー';
    }
}
