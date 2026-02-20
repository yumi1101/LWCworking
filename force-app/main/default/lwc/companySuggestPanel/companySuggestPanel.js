import { LightningElement, track } from 'lwc';
import searchCompanies from '@salesforce/apex/CompanySuggestService.searchCompanies';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const DEBOUNCE_MS = 350;
const MIN_CHARS = 2;

export default class CompanySuggestPanel extends LightningElement {
	@track query = '';
	@track candidates = [];
	@track loading = false;
	@track debugMsg = '';
	timer;
	selectedIndex;

	handleInput(e) {
		// 入力値を保持し、前回の検索予約があればキャンセルする
		console.log('[companySuggestPanel] handleInput called, event:', e);
		this.query = e.target.value || '';
		console.log('[companySuggestPanel] handleInput - query set to:', this.query);
		this.debugMsg = `input: ${this.query}`;
		clearTimeout(this.timer);
		// 実質2文字未満のときは候補を消して検索しない
		const trimmedLength = (this.query || '').replace(/\s+/g, '').length;
		console.log('[companySuggestPanel] trimmed length:', trimmedLength, 'MIN_CHARS:', MIN_CHARS);
		this.debugMsg = `len:${trimmedLength}`;
		if (trimmedLength < MIN_CHARS) {
			console.log('[companySuggestPanel] below MIN_CHARS, clearing candidates');
			this.candidates = [];
			return;
		}
		// 入力途中の連続呼び出しを避けるため、少し待ってから検索する
		console.log('[companySuggestPanel] setting timeout for doSearch');
		this.debugMsg = 'waiting to search...';
		this.timer = setTimeout(() => this.doSearch(), DEBOUNCE_MS);
	}

	async doSearch() {
		const q = this.query;
		console.log('[companySuggestPanel] doSearch started with query:', q);
		this.debugMsg = `doSearch: ${q}`;
		// クライアント側でも最終的な文字数ガードを行う
		if (!q || q.trim().length < MIN_CHARS) {
			console.log('[companySuggestPanel] query too short or empty, returning');
			return;
		}

        

		// --- Mock mode for local testing ---
		// ユーザが 'test' を入力するか 'mock:...' で始めるとダミー応答を返す
		const qTrim = q.trim();
		console.log('[companySuggestPanel] qTrim:', qTrim, 'toLowerCase:', qTrim.toLowerCase());
		this.debugMsg = `qTrim:${qTrim}`;
		if (qTrim.toLowerCase() === 'test' || qTrim.toLowerCase().startsWith('mock:')) {
			console.log('[companySuggestPanel] Mock mode triggered!');
			this.debugMsg = `mock:${seed}`;
			const seed = qTrim.toLowerCase().startsWith('mock:') ? qTrim.substring(5).trim() : qTrim;
			this.candidates = [
				{ name: `Mock Co ${seed} A`, jurisdictionCode: 'jp', companyNumber: 'MCK-001', status: 'active', rawAddress: 'Tokyo', source: 'Mock', statusLabel: ' • active' },
				{ name: `Mock Co ${seed} B`, jurisdictionCode: 'jp', companyNumber: 'MCK-002', status: 'inactive', rawAddress: 'Osaka', source: 'Mock', statusLabel: ' • inactive' },
				{ name: `Mock Co ${seed} C`, jurisdictionCode: 'us_ca', companyNumber: 'MCK-003', status: null, rawAddress: 'San Francisco', source: 'Mock', statusLabel: '' }
			];
			this.selectedIndex = this.candidates.length ? 0 : undefined;
			console.log('[companySuggestPanel] Mock candidates set:', this.candidates);
			this.debugMsg = `mock set ${this.candidates.length}`;
			// show a toast so tester knows mock mode was used
			this.toast('Mock data', `Mock results for "${seed}" loaded`, 'info');
			this.loading = false;
			console.log('[companySuggestPanel] Mock mode complete, returning');
			return;
		}
		this.loading = true;
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
			this.toast('検索に失敗しました', this.errorMessage(err), 'error');
			this.candidates = [];
		} finally {
			// 成否にかかわらずローディング状態を解除する
			this.loading = false;
		}
	}

	handleSelect(e) {
		const idx = e.currentTarget.dataset.idx;
		if (!idx) return;
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
