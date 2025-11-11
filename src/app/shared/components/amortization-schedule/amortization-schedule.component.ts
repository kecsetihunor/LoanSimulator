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

  displayedSchedule: PaymentScheduleRow[] = [];

   downloadPdf() {
    const doc = new jsPDF();

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
      styles: { halign: 'right' },
      headStyles: { fillColor: [147, 112, 219] }
    });

    doc.save('amortization-schedule.pdf');
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
