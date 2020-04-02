import {OceanOfCodeComponent} from "./app";
import './style.css';

const PACKAGE = require('./../package.json');

export function defineElements() {
    customElements.define('ocean-of-code', OceanOfCodeComponent);
}

function createHeader(): HTMLElement {
    const headerElement = document.createElement('header');
    headerElement.style.display = 'flex';
    headerElement.style.margin = '10px';

    return headerElement;
}

export const createElement: () => HTMLElement = () => {
    const mainElement = document.createElement('div');
    mainElement.style.display = 'flex';
    mainElement.style.flex = '1 1 auto';
    mainElement.style.flexDirection = 'column';
    mainElement.style.justifyContent = 'space-between';

    const body = createBody();

    mainElement.appendChild(createHeader());
    mainElement.appendChild(body);
    mainElement.appendChild(createFooter());

    return mainElement;
};


function createFooter(): HTMLElement {
    const footerElement = document.createElement('footer');

    footerElement.textContent = `version ${PACKAGE.version}`;
    return footerElement;
}

function createBody(): HTMLElement {
    const bodyElement = document.createElement('div');
    bodyElement.style.flex = "1 1 auto";
    bodyElement.style.display = "flex";

    const oceanOfCode = document.createElement('ocean-of-code');
    oceanOfCode.style.flex = "1 1 auto";
    oceanOfCode.style.display = "flex";

    bodyElement.appendChild(oceanOfCode);

    return bodyElement;
}
