import { LightningElement, track } from 'lwc';
import searchCompanies from '@salesforce/apex/CompanySuggestService.searchCompanies';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const DEBOUNCE_MS = 350;
const MIN_CHARS = 2;

export default class CompanySuggestPanel extends LightningElement {
	@track query = '';
	@track candidates = [];
	@track loading = false;
	timer;
	selectedIndex;

	handleInput(e) {
		this.query = e.target.value || '';
		clearTimeout(this.timer);
		if ((this.query || '').replace(/\s+/g, '').length < MIN_CHARS) {
			this.candidates = [];
			return;
		}
		this.timer = setTimeout(() => this.doSearch(), DEBOUNCE_MS);
	}

	async doSearch() {
		const q = this.query;
		if (!q || q.trim().length < MIN_CHARS) return;
		this.loading = true;
		try {
			const res = await searchCompanies({ query: q, jurisdictionOpt: null, limitOpt: 10 });
			this.candidates = res || [];
			this.selectedIndex = this.candidates.length ? 0 : undefined;
			if (!this.candidates.length) {
				// show nothing but not an error
			}
		} catch (err) {
			this.toast('検索に失敗しました', this.errorMessage(err), 'error');
			this.candidates = [];
		} finally {
			this.loading = false;
		}
	}

	handleSelect(e) {
		const idx = e.currentTarget.dataset.idx;
		if (!idx) return;
		const candidate = this.candidates[Number(idx)];
		if (!candidate) return;
		// dispatch event to parent
		this.dispatchEvent(new CustomEvent('companyselect', {
			detail: { company: candidate }, bubbles: true, composed: true
		}));
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