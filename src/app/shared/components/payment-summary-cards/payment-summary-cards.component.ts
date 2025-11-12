import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrencyService } from '@core/services/currency.service';
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

   private currencyService = inject(CurrencyService);
  
  get currency() {
    return this.currencyService.getSelectedCurrency();
  }
}
