import { LightningElement, track } from 'lwc';
import searchCompanies from '@salesforce/apex/CompanySuggestService.searchCompanies';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const DEBOUNCE_MS = 350;
const MIN_CHARS = 2;

export default class CompanySuggestPanel extends LightningElement {
	@track query = '';
	@track candidates = [];
	@track loading = false;
	@track hasSearched = false;
	@track searchError = '';
	@track debugMsg = '';
	timer;
	selectedIndex;

	connectedCallback() {
		this.debugMsg = 'connectedCallback: CompanySuggestPanel loaded (' + new Date().toLocaleString() + ')';
		// eslint-disable-next-line no-console
		console.log(this.debugMsg);
	}

	handleInput(e) {
		// 入力値を保持し、前回の検索予約があればキャンセルする
		this.query = e.target.value || '';
		clearTimeout(this.timer);
		// 実質2文字未満のときは候補を消して検索しない
		if ((this.query || '').replace(/\s+/g, '').length < MIN_CHARS) {
			this.candidates = [];
			this.hasSearched = false;
			this.searchError = '';
			return;
		}
		// 入力途中の連続呼び出しを避けるため、少し待ってから検索する
		this.timer = setTimeout(() => this.doSearch(), DEBOUNCE_MS);
	}

	async doSearch() {
		const q = this.query;
		// クライアント側でも最終的な文字数ガードを行う
		if (!q || q.trim().length < MIN_CHARS) return;
		this.loading = true;
		this.hasSearched = true;
		this.searchError = '';
		try {
			// Apex経由で会社候補を取得する（件数は10件固定）
			const res = await searchCompanies({ query: q, jurisdictionOpt: null, limitOpt: 10 });
			// テンプレート側の式を簡潔にするため、表示用のstatusLabelを付与する
			this.candidates = (res || []).map(candidate => {
				const statusLabel = candidate.status ? ' • ' + candidate.status : '';
				return Object.assign({}, candidate, { statusLabel });
			});
			// 候補がある場合は先頭を選択状態にする
			this.selectedIndex = this.candidates.length ? 0 : undefined;
			if (!this.candidates.length) {
				// 結果0件は正常系として扱い、エラー表示はしない
			}
		} catch (err) {
			// 通信・Apex例外はトースト表示して候補をクリアする
			this.searchError = this.errorMessage(err);
			this.toast('検索に失敗しました', this.searchError, 'error');
			this.candidates = [];
		} finally {
			// 成否にかかわらずローディング状態を解除する
			this.loading = false;
		}
	}

	get hasResults() {
		return (this.candidates || []).length > 0;
	}

	get showNoResults() {
		return this.hasSearched && !this.loading && !this.searchError && !this.hasResults;
	}

	handleSelect(e) {
		const idx = e.currentTarget.dataset.idx;
		if (idx === undefined || idx === null) return;
		const candidate = this.candidates[Number(idx)];
		if (!candidate) return;
		// 親コンポーネントへ選択会社を通知する
		this.dispatchEvent(new CustomEvent('companyselect', {
			detail: { company: candidate }, bubbles: true, composed: true
		}));
	}

	toast(title, message, variant) {
		// 標準トーストイベントを発火する共通ヘルパー
		this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
	}

	errorMessage(err) {
		// AuraHandledExceptionなどの構造差分を吸収して表示メッセージを返す
		if (!err) return '不明なエラー';
		if (err.body && err.body.message) return err.body.message;
		return err.message || '不明なエラー';
	}
}
