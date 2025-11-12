import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  private currencies: Currency[] = [
    { code: 'RON', symbol: 'RON', name: 'Romanian Leu' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'USD', symbol: '$', name: 'US dollar' }
  ];

  private selectedCurrencySubject = new BehaviorSubject<Currency>(this.currencies[0]);
  public selectedCurrency$: Observable<Currency> = this.selectedCurrencySubject.asObservable();

  constructor() { }

  getCurrencies(): Currency[] {
    return this.currencies;
  }

  getSelectedCurrency(): Currency {
    return this.selectedCurrencySubject.value;
  }

  setSelectedCurrency(currency: Currency): void {
    this.selectedCurrencySubject.next(currency);
  }
}