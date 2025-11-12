import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentScheduleRow } from '@app/shared/models/loan.models';
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

   downloadPdf() {
    const doc = new jsPDF();
    let yPosition = 20;

    // Title
    doc.setFontSize(18);
    doc.setTextColor(147, 112, 219); // Purple
    doc.text('Loan Amortization Schedule', 14, yPosition);
    yPosition += 10;

    // Loan Details Section
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0); // Black

    if (this.loanAmount !== null) {
      doc.text(`Loan Amount: ${this.loanAmount!.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14, yPosition);
      yPosition += 7;
    }

    if (this.totalPeriod !== null) {
      doc.text(`Total Period: ${this.totalPeriod} months`, 14, yPosition);
      yPosition += 7;
    }

    if (this.fixedRate !== null) {
      if (this.fixedMonths !== null && this.variableRate !== null) {
        // Advanced calculator with both rates
        doc.text(`Fixed Rate: ${this.fixedRate}% (first ${this.fixedMonths} months)`, 14, yPosition);
        yPosition += 7;
        doc.text(`Variable Rate: ${this.variableRate}% (remaining ${this.totalPeriod! - this.fixedMonths!} months)`, 14, yPosition);
        yPosition += 7;
      } else {
        // Simple calculator with single rate
        doc.text(`Interest Rate: ${this.fixedRate}%`, 14, yPosition);
        yPosition += 7;
      }
    }

    doc.text(`Payment Type: ${this.scheduleType === 'annuity' ? 'Annuity (Equal Payments)' : 'Linear (Decreasing Payments)'}`, 14, yPosition);
    yPosition += 10;

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
