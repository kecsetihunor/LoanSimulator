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
  @Input() insuranceRate: number | null = null;
  @Input() fixedRate: number | null = null;
  @Input() variableRate: number | null = null;
  @Input() fixedMonths: number | null = null;
  @Input() scheduleType: 'annuity' | 'linear' = 'annuity'; // To customize the filename
  @Input() showAnnuity: boolean = false;
  @Input() showLinear: boolean = false;

  displayedSchedule: PaymentScheduleRow[] = [];
  currencyService = inject(CurrencyService);

downloadPdf() {
  const doc = new jsPDF();
  let yPosition = 8;
  let xLabel = 16;
  let xValue = 64;
  let currency = this.currencyService.getSelectedCurrency();

  // Section Header for Details
  doc.setFontSize(16);
  doc.setTextColor(110, 100, 150);
  doc.text($localize`Loan Details`, xLabel, yPosition, { baseline: 'top' });
  yPosition += 8;
  doc.setDrawColor(147, 112, 219);
  doc.line(xLabel, yPosition, xLabel + 60, yPosition);

  yPosition += 6;
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);

  function detail(label: string, value: string) {
    doc.text(label, xLabel, yPosition, { baseline: 'top' });
    doc.text(value, xValue, yPosition, { baseline: 'top' });
    yPosition += 8;
  }

  if (this.loanAmount !== null) {
    detail(
      $localize`Loan Amount:`,
      `${this.loanAmount!.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency.symbol}`
    );
  }

  if (this.totalPeriod !== null) {
    detail($localize`Total Period:`, $localize`${this.totalPeriod} months`);
  }

  if (this.fixedRate !== null) {
    if (this.fixedMonths !== null && this.variableRate !== null) {
      detail($localize`Fixed Rate:`, $localize`${this.fixedRate}% (first ${this.fixedMonths} months)`);
      detail($localize`Variable Rate:`, $localize`${this.variableRate}% (remaining ${this.totalPeriod! - this.fixedMonths!} months)`);
    } else {
      detail($localize`Interest Rate:`, `${this.fixedRate}%`);
    }
  }

  if (this.insuranceRate !== null) {
    detail($localize`Insurance rate:`, `${this.insuranceRate}%`);
  }

  // Payment Type
  doc.text($localize`Payment Type:`, xLabel, yPosition, { baseline: 'top' });
  doc.text(
    this.scheduleType === 'annuity'
      ? $localize`Annuity (Equal Payments)`
      : $localize`Linear (Decreasing Payments)`,
    xValue,
    yPosition,
    { baseline: 'top' }
  );
  doc.setTextColor(0, 0, 0);
  yPosition += 12;

  // Section Header
  doc.setFontSize(16);
  doc.setTextColor(110, 100, 150);
  doc.text($localize`Amortization Schedule`, xLabel, yPosition, { baseline: 'top' });
  yPosition += 8;
  doc.setDrawColor(147, 112, 219);
  doc.line(xLabel, yPosition, xLabel + 60, yPosition);
  yPosition += 6;
  doc.setFontSize(12);

  // Prepare table data
  let columns = [];
  let rows = [];
  if (this.insuranceRate !== null) {
    columns = [
      { header: $localize`Month`, dataKey: 'month' },
      { header: $localize`Payment`, dataKey: 'payment' },
      { header: $localize`Principal`, dataKey: 'principal' },
      { header: $localize`Interest`, dataKey: 'interest' },
      { header: $localize`Insurance`, dataKey: 'insurance' },
      { header: $localize`Remaining Balance`, dataKey: 'remainingBalance' }
    ];

    rows = this.schedule.map(row => ({
      month: row.month,
      payment: row.payment.toFixed(2),
      principal: row.principal.toFixed(2),
      interest: row.interest.toFixed(2),
      insurance: row.insurance!.toFixed(2),
      remainingBalance: row.remainingBalance.toFixed(2),
    }));
  } else {
    columns = [
      { header: $localize`Month`, dataKey: 'month' },
      { header: $localize`Payment`, dataKey: 'payment' },
      { header: $localize`Principal`, dataKey: 'principal' },
      { header: $localize`Interest`, dataKey: 'interest' },
      { header: $localize`Remaining Balance`, dataKey: 'remainingBalance' }
    ];
    rows = this.schedule.map(row => ({
      month: row.month,
      payment: row.payment.toFixed(2),
      principal: row.principal.toFixed(2),
      interest: row.interest.toFixed(2),
      remainingBalance: row.remainingBalance.toFixed(2),
    }));
  }

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
