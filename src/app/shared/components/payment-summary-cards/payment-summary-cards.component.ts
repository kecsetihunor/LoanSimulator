import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payment-summary-cards',
  templateUrl: './payment-summary-cards.component.html',
  styleUrls: ['./payment-summary-cards.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class PaymentSummaryCardsComponent {
  @Input() annuityPayment: number | null = null;
  @Input() annuityTotal: number | null = null;
  @Input() linearPayment: number | null = null;
  @Input() linearTotal: number | null = null;
  @Input() amount: number | null = null;
}
