import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentScheduleRow } from '@app/shared/models/loan.models';
import { CurrencyService } from '@core/services/currency.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  @Input() fixedRate: number | null = null;
  @Input() variableRate: number | null = null;
  @Input() fixedMonths: number | null = null;
  @Input() scheduleType: 'annuity' | 'linear' = 'annuity'; // To customize the filename

  displayedSchedule: PaymentScheduleRow[] = [];
  currencyService = inject(CurrencyService);

  downloadPdf() {
   const doc = new jsPDF();
    let yPosition = 8; // Slightly larger top margin
    let xLabel = 16;
    let xValue = 64;
    let currency = this.currencyService.getSelectedCurrency();

  // Section Header for Details (optional)
  doc.setFontSize(16);
  doc.setTextColor(110, 100, 150); // Subtle accent
  doc.text('Loan Details', xLabel, yPosition, { baseline: 'top' });
  yPosition += 8;
  doc.setDrawColor(147, 112, 219);
  doc.line(xLabel, yPosition, xLabel + 60, yPosition); // Underline for section

  yPosition += 6;
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0); // Black

  // Helper: Bold label, normal value
  function detail(label: string, value: string) {
    doc.setFont('helvetica', 'bold');
    doc.text(label, xLabel, yPosition, { baseline: 'top' });
    doc.setFont('helvetica', 'normal');
    doc.text(value, xValue, yPosition, { baseline: 'top' });
    yPosition += 8;
  }

  if (this.loanAmount !== null) {
    detail(
      'Loan Amount:',
      `${this.loanAmount!.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency.symbol}`
    );
  }

  if (this.totalPeriod !== null) {
    detail('Total Period:', `${this.totalPeriod} months`);
  }

  if (this.fixedRate !== null) {
    if (this.fixedMonths !== null && this.variableRate !== null) {
      detail('Fixed Rate:', `${this.fixedRate}% (first ${this.fixedMonths} months)`);
      detail('Variable Rate:', `${this.variableRate}% (remaining ${this.totalPeriod! - this.fixedMonths!} months)`);
    } else {
      detail('Interest Rate:', `${this.fixedRate}%`);
    }
  }

    // Payment Type - call out with different color if you wish
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Type:', xLabel, yPosition, { baseline: 'top' });
    doc.setFont('helvetica', 'normal');
    doc.text(
      this.scheduleType === 'annuity'
        ? 'Annuity (Equal Payments)'
        : 'Linear (Decreasing Payments)',
      xValue,
      yPosition,
      { baseline: 'top' }
    );
    doc.setTextColor(0, 0, 0);
    yPosition += 12;


    // Section Header for Details (optional)
    doc.setFontSize(16);
    doc.setTextColor(110, 100, 150); // Subtle accent
    doc.text('Amortization Schedule', xLabel, yPosition, { baseline: 'top' });
    yPosition += 8;
    doc.setDrawColor(147, 112, 219);
    doc.line(xLabel, yPosition, xLabel + 60, yPosition); // Underline for section
    yPosition += 6;
    doc.setFontSize(12);

    // Prepare table data
    const columns = [
      { header: 'Month', dataKey: 'month' },
      { header: 'Payment', dataKey: 'payment' },
      { header: 'Principal', dataKey: 'principal' },
      { header: 'Interest', dataKey: 'interest' },
      { header: 'Remaining Balance', dataKey: 'remainingBalance' }
    ];

    const rows = this.schedule.map(row => ({
      month: row.month,
      payment: row.payment.toFixed(2),
      principal: row.principal.toFixed(2),
      interest: row.interest.toFixed(2),
      remainingBalance: row.remainingBalance.toFixed(2),
    }));

    autoTable(doc, {
      columns,
      body: rows,
      startY: yPosition,
      styles: { halign: 'right' },
      headStyles: { fillColor: [147, 112, 219] },
      theme: 'striped'
    });

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${this.scheduleType}-schedule-${timestamp}.pdf`;
    doc.save(filename);
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
