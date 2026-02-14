import { LightningElement, track } from 'lwc';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';

// それぞれ「単体ファイル」の静的リソース名に合わせる
import CAL_JS  from '@salesforce/resourceUrl/calHeatmapJs';
import CAL_CSS from '@salesforce/resourceUrl/calHeatmapCss';

export default class ActivityHeatMap extends LightningElement {
  @track loading = true;
  _loaded = false;
  cal;

  renderedCallback() {
    if (this._loaded) return;
    this._loaded = true;

    console.log('[LWC] CAL_JS =', CAL_JS);
    console.log('[LWC] CAL_CSS =', CAL_CSS);

    Promise.all([
      loadStyle(this,  CAL_CSS),
      loadScript(this, CAL_JS)
    ])
    .then(() => {
      console.log('[LWC] typeof window.CalHeatmap =', typeof window.CalHeatmap);
      if (typeof window.CalHeatmap !== 'function') {
        console.error('[LWC] 読み込んだJSがUMDではありません（ESMを読んでいる可能性）');
        this.loading = false;
        return;
      }
      return this.paintSmoke();  // まずはダミーデータで描画確認
    })
    .catch(e => {
      console.error('[LWC] load error:', e);
    })
    .finally(() => {
      this.loading = false;  // どんな経路でもスピナーは止める
    });
  }

  async paintSmoke() {
    const host = this.template.querySelector('#cal-heatmap');
    if (!host) { console.error('[LWC] host not found'); return; }

    // 14日分のダミーデータ
    const today = new Date();
    const data = Array.from({length: 14}, (_, i) => {
      const d = new Date(today); d.setDate(d.getDate() - i);
      return { date: d.toISOString().slice(0,10), value: Math.floor(Math.random() * 9) };
    });
    const max = data.reduce((m, d) => Math.max(m, d.value), 0) || 1;

    if (this.cal) this.cal.destroy();
    this.cal = new window.CalHeatmap();

    try {
      await this.cal.paint({
        itemSelector: host,                // Element を渡す
        range: 1,
        domain: { type: 'month' },
        subDomain: { type: 'day', width: 14, height: 14, radius: 2, gutter: 4 },
        date: { start: new Date(today.getFullYear(), today.getMonth(), 1), locale: 'ja' },
        data: { source: data, x: 'date', y: v => v.value },
        scale: { color: { type: 'linear', domain: [0, max] } }
      });
      console.log('[LWC] paint done');
    } catch (e) {
      console.error('[LWC] paint error', e);
    }
  }
}
