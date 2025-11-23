import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormatCurrencyPipe } from '@pipes/format-currency.pipe';

@Component({
  selector: 'app-payment-summary-cards',
  templateUrl: './payment-summary-cards.component.html',
  styleUrls: ['./payment-summary-cards.component.css'],
  standalone: true,
  imports: [CommonModule, FormatCurrencyPipe]
})

export class PaymentSummaryCardsComponent {
  @Input() firstPayment: number | null = null;
  @Input() total: number | null = null;
  @Input() amount: number | null = null;
  @Input() interestTotal: number | null = null;
  @Input() insuranceTotal: number | null = null;
  @Input() savingAmount: number | null = null;
  @Input() isSavingBadgeVisible: boolean = true;
  @Input() isAnnuityPayment: boolean = true;
  @Input() IsInsuranceRateEnabled: boolean = true;
  @Input() alertClass: string = 'alert-green';
}
