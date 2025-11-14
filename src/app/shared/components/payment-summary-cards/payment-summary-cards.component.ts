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
  @Input() annuityPayment: number | null = null;
  @Input() annuityTotal: number | null = null;
  @Input() linearPayment: number | null = null;
  @Input() linearTotal: number | null = null;
  @Input() amount: number | null = null;
  @Input() showAnnuity: boolean = true;
  @Input() showLinear: boolean = true;
}
