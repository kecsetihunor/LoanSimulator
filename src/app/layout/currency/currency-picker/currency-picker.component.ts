import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrencyService, Currency } from '@core/services/currency.service';

@Component({
  selector: 'app-currency-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './currency-picker.component.html',
  styleUrl: './currency-picker.component.css'
})

export class CurrencyPickerComponent implements OnInit {
  currencies: Currency[] = [];
  selectedCurrency: Currency | null = null;

  constructor(private currencyService: CurrencyService) {}

  ngOnInit(): void {
    this.currencies = this.currencyService.getCurrencies();
    this.currencyService.selectedCurrency$.subscribe(currency => {
      this.selectedCurrency = currency;
    });
  }

  onCurrencyChange(currency: Currency): void {
    this.currencyService.setSelectedCurrency(currency);
  }
}
