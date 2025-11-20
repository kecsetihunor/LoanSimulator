import { inject } from '@angular/core';
import { FormatCurrencyPipe } from './format-currency.pipe';
import { CurrencyService } from '@core/services/currency.service';

describe('FormatCurrencyPipe', () => {
  it('create an instance', () => {
    let currencyService = inject(CurrencyService);
    const pipe = new FormatCurrencyPipe('en-US', currencyService);
    expect(pipe).toBeTruthy();
  });
});
