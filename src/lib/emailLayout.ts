/**
 * Gjør bilde+tekst-tabeller e-postsikre uten å stable dem.
 * Desktop e-post beholder side-om-side; mobil-stacking skjer kun via @media der klienten støtter det.
 */
export function prepareImageTextTablesForEmail(root: HTMLElement): void {
  root.querySelectorAll('table.nl-stack').forEach((table) => {
    const row = table.querySelector('tr');
    if (!row) return;

    row.querySelectorAll('td[width="20"], td[width="15"]').forEach((spacer) => spacer.remove());

    const imageCell = table.querySelector('td.nl-stack-image') as HTMLTableCellElement | null;
    const textCell = table.querySelector(
      'td.nl-stack-col:not(.nl-stack-image)'
    ) as HTMLTableCellElement | null;
    if (!imageCell || !textCell) return;

    const cells = Array.from(row.children).filter((el) => el.tagName === 'TD');
    const imageFirst = cells.indexOf(imageCell) < cells.indexOf(textCell);

    table.setAttribute('width', '100%');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';

    const imageWidth = 200;
    const textWidth = 324;

    imageCell.setAttribute('width', String(imageWidth));
    imageCell.setAttribute('valign', 'top');
    imageCell.style.width = `${imageWidth}px`;
    imageCell.style.maxWidth = `${imageWidth}px`;
    imageCell.style.verticalAlign = 'top';
    imageCell.style.paddingBottom = '0';
    imageCell.style.paddingRight = imageFirst ? '16px' : '0';
    imageCell.style.paddingLeft = imageFirst ? '0' : '16px';

    imageCell.querySelectorAll('img').forEach((img) => {
      img.setAttribute('width', String(imageWidth));
      img.style.display = 'block';
      img.style.width = `${imageWidth}px`;
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      img.style.border = '0';
    });

    textCell.setAttribute('width', String(textWidth));
    textCell.setAttribute('valign', 'top');
    textCell.style.width = `${textWidth}px`;
    textCell.style.maxWidth = `${textWidth}px`;
    textCell.style.verticalAlign = 'top';
    textCell.style.paddingLeft = '0';
    textCell.style.paddingRight = '0';
    textCell.style.wordBreak = 'break-word';
    textCell.style.overflowWrap = 'break-word';
    textCell.style.boxSizing = 'border-box';

    textCell.querySelectorAll('h2, h3, p, div, a').forEach((el) => {
      const node = el as HTMLElement;
      node.style.wordBreak = 'break-word';
      node.style.overflowWrap = 'break-word';
      node.style.maxWidth = '100%';
    });
  });
}
