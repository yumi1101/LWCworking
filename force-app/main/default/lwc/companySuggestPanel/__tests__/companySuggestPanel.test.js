import { createElement } from '@lwc/engine-dom';
import CompanySuggestPanel from 'c/companySuggestPanel';

describe('c-company-suggest-panel', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('renders input', () => {
        const element = createElement('c-company-suggest-panel', { is: CompanySuggestPanel });
        document.body.appendChild(element);
        const input = element.shadowRoot.querySelector('lightning-input');
        expect(input).not.toBeNull();
    });
});
