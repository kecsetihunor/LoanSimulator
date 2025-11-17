import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentScheduleRow } from '@app/shared/models/loan.models';
import { CurrencyService } from '@core/services/currency.service';
import pdfMake from 'pdfmake/build/pdfmake';

@Component({
  selector: 'app-amortization-schedule',
  imports: [CommonModule],
  templateUrl: './amortization-schedule.component.html'
})
export class AmortizationScheduleComponent {
  @Input() schedule: PaymentScheduleRow[] = [];
  @Input() showAll: boolean = false;
  @Input() loanAmount: number | null = null;
  @Input() totalPeriod: number | null = null;
  @Input() insuranceRate: number | null = null;
  @Input() fixedRate: number | null = null;
  @Input() variableRate: number | null = null;
  @Input() fixedMonths: number | null = null;
  @Input() scheduleType: 'annuity' | 'linear' = 'annuity'; // To customize the filename
  @Input() showAnnuity: boolean = false;
  @Input() showLinear: boolean = false;

  displayedSchedule: PaymentScheduleRow[] = [];
  currencyService = inject(CurrencyService);

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

  // Prepare loan details
  const detailsContent: any[] = [];
  
  if (this.loanAmount !== null) {
    detailsContent.push({
      columns: [
        {
          text: $localize`Suma creditului:`,
          width: '50%',
          bold: true
        },
        {
          // Format numbers for Romanian locale so decimals and thousands separators
          // appear correctly for the default app language.
          text: `${this.loanAmount!.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency.symbol}`,
          width: '50%'
        }
      ],
      margin: [0, 5]
    });
  }

  if (this.totalPeriod !== null) {
    detailsContent.push({
      columns: [
        { text: $localize`Perioada totală:`, width: '50%', bold: true },
        { text: `${this.totalPeriod} luni`, width: '50%' }
      ],
      margin: [0, 5]
    });
  }

  if (this.fixedRate !== null) {
    if (this.fixedMonths !== null && this.variableRate !== null) {
      detailsContent.push({
        columns: [
          { text: $localize`Dobândă fixă:`, width: '50%', bold: true },
          { text: `${this.fixedRate}% (primele ${this.fixedMonths} luni)`, width: '50%' }
        ],
        margin: [0, 5]
      });
      detailsContent.push({
        columns: [
          { text: $localize`Dobândă variabilă:`, width: '50%', bold: true },
          { text: `${this.variableRate}% (restul de ${this.totalPeriod! - this.fixedMonths!} luni)`, width: '50%' }
        ],
        margin: [0, 5]
      });
    } else {
      detailsContent.push({
        columns: [
          { text: $localize`Dobândă:`, width: '50%', bold: true },
          { text: `${this.fixedRate}%`, width: '50%' }
        ],
        margin: [0, 5]
      });
    }
  }

  if (this.insuranceRate !== null) {
    detailsContent.push({
      columns: [
        { text: $localize`Asigurare de viață:`, width: '50%', bold: true },
        { text: `${this.insuranceRate}%`, width: '50%' }
      ],
      margin: [0, 5]
    });
  }

  detailsContent.push({
    columns: [
      { text: $localize`Tip rată:`, width: '50%', bold: true },
      {
        text: this.scheduleType === 'annuity'
          ? $localize`Vezi scadențar (rate egale)`
          : $localize`Vezi scadențar (rate descrescătoare)`,
        width: '50%'
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
      // Use locale-aware formatting for currency/amounts
      row.payment.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      row.principal.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      row.interest.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    ];
    
    if (this.insuranceRate !== null) {
      rowData.push(row.insurance!.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    }
    
    rowData.push(row.remainingBalance.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
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

  
  ngOnChanges() {
      if (this.showAll) {
        this.displayedSchedule = this.schedule;
      } else {
        // Show first 12 months by default
        this.displayedSchedule = this.schedule.slice(0, 12);
      }
    }

    toggleShowAll() {
      this.showAll = !this.showAll;
      this.ngOnChanges();
    }
}
