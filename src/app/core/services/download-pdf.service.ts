import { Injectable, Input, inject, LOCALE_ID} from '@angular/core';
import pdfMake from 'pdfmake/build/pdfmake';
import { CurrencyService } from '@core/services/currency.service';
import { PaymentScheduleRow } from '@app/shared/models/loan.models';

@Injectable({
  providedIn: 'root'
})

export class DownloadPdfService {

  currencyService = inject(CurrencyService);
  appLocale = inject(LOCALE_ID) as string;

  @Input() schedule: PaymentScheduleRow[] = [];
  @Input() amount: number | null = null;
  @Input() totalPeriod: number | null = null;
  @Input() insuranceRate: number | null = null;
  @Input() fixedRate: number | null = null;
  @Input() variableRate: number | null = null;
  @Input() fixedMonths: number | null = null;
  @Input() scheduleType: string | null = null;

  async downloadPdf(): Promise<void> {
    // Lazy load fonts if not already loaded. Use dynamic import() (ES modules) so
    // bundlers don't replace it with a runtime require that fails in the browser.
    if (!(pdfMake as any).vfs) {
      const pdfFontsModule = await import('pdfmake/build/vfs_fonts');
      // vfs_fonts.js exports the vfs object (CommonJS). Depending on bundler
      // it may be the module default or the module itself. Normalize both.
      const vfs = (pdfFontsModule as any).default || (pdfFontsModule as any);
      (pdfMake as any).vfs = vfs;
    }

    const currency = this.currencyService.getSelectedCurrency();
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${this.scheduleType}-schedule-${timestamp}.pdf`;
    // Prepare number formatter based on the application's LOCALE_ID so PDF
    // numbers match the app's language. Use non-breaking space for thousands.
    const numberFormatter = new Intl.NumberFormat(this.appLocale || 'ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const formatNumber = (n: number) => numberFormatter.format(n);

    // Prepare loan details
    const detailsContent: any[] = [];
    
    if (this.amount !== null) {
      detailsContent.push({
        columns: [
          {
            text: $localize`Suma creditului:`,
            width: '30%',
            bold: true
          },
          {
            // Format numbers using the app locale
            text: `${formatNumber(this.amount!)} ${currency.symbol}`,
            width: '70%'
          }
        ],
        margin: [0, 5]
      });
    }

    if (this.totalPeriod !== null) {
      detailsContent.push({
        columns: [
          { text: $localize`Perioada totală:`, width: '30%', bold: true },
          { text: `${this.totalPeriod} luni`, width: '70%' }
        ],
        margin: [0, 5]
      });
    }

    if (this.fixedRate !== null) {
      if (this.fixedMonths !== null && this.variableRate !== null) {
        detailsContent.push({
          columns: [
            { text: $localize`Dobândă fixă:`, width: '30%', bold: true },
            { text: $localize`${this.fixedRate}% (primele ${this.fixedMonths} luni)`, width: '70%' }
          ],
          margin: [0, 5]
        });
        detailsContent.push({
          columns: [
            { text: $localize`Dobândă variabilă:`, width: '30%', bold: true },
            { text: $localize`${this.variableRate}% (restul de ${this.totalPeriod! - this.fixedMonths!} luni)`, width: '70%' }
          ],
          margin: [0, 5]
        });
      } else {
        detailsContent.push({
          columns: [
            { text: $localize`Dobândă:`, width: '30%', bold: true },
            { text: `${this.fixedRate}%`, width: '70%' }
          ],
          margin: [0, 5]
        });
      }
    }

    if (this.insuranceRate !== null) {
      detailsContent.push({
        columns: [
          { text: $localize`Asigurare de viață:`, width: '30%', bold: true },
          { text: `${this.insuranceRate}%`, width: '70%' }
        ],
        margin: [0, 5]
      });
    }

    detailsContent.push({
      columns: [
        { text: $localize`Tip rată:`, width: '30%', bold: true },
        {
          text: this.scheduleType === 'annuity'
            ? $localize`Rate egale`
            : $localize`Rate descrescătoare`,
          width: '70%'
        }
      ],
      margin: [0, 5]
    });

    // Prepare table headers and body
    const tableHeaders = this.insuranceRate !== null
      ? [
        $localize`Lună`,
        $localize`Plată`,
        $localize`Principal`,
        $localize`Dobândă`,
        $localize`Asigurare`,
        $localize`Sold rămas`
      ]
      : [
        $localize`Lună`,
        $localize`Plată`,
        $localize`Principal`,
        $localize`Dobândă`,
        $localize`Sold rămas`
      ];

    const tableBody = this.schedule.map(row => {
      const rowData = [
        row.month.toString(),
        formatNumber(row.payment),
        formatNumber(row.principal),
        formatNumber(row.interest)
      ];
      
      if (this.insuranceRate !== null) {
        rowData.push(formatNumber(row.insurance!));
      }
      
      rowData.push(formatNumber(row.remainingBalance));
      return rowData;
    });

    const docDefinition: any = {
      content: [
        {
          text: $localize`Detalii credit`,
          fontSize: 16,
          bold: true,
          color: '#6e6496',
          margin: [0, 0, 0, 10]
        },
        ...detailsContent,
        {
          text: $localize`Scadențar credit`,
          fontSize: 16,
          bold: true,
          color: '#6e6496',
          margin: [0, 20, 0, 10]
        },
        {
          table: {
            headerRows: 1,
            widths: this.insuranceRate !== null ? ['8%', '15%', '15%', '15%', '15%', '17%'] : ['10%', '18%', '18%', '18%', '18%', '18%'],
            body: [tableHeaders, ...tableBody]
          },
          layout: {
            fillColor: (rowIndex: number) => {
              if (rowIndex === 0) return '#9370db'; // Header color
              return rowIndex % 2 === 0 ? '#f9f9f9' : '#ffffff';
            },
            hLineColor: () => '#ddd',
            vLineColor: () => '#ddd'
          },
          margin: [0, 0, 0, 20]
        }
      ],
      defaultStyle: {
        font: 'Roboto'
      },
      styles: {
        tableHeader: {
          bold: true,
          color: 'white',
          alignment: 'center'
        }
      }
    };

    pdfMake.createPdf(docDefinition).download(filename);
  }
}
