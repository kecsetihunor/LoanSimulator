import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { LoanData } from '@shared/models/loan.models';
import { CookieService } from './cookie.service';

@Injectable({
  providedIn: 'root'
})

export class LoanDataService {
  private cookieService = inject(CookieService);
  private readonly loanDataCookieName = 'loanData';

  private loanDataSource = new BehaviorSubject<LoanData>({
    amount: null,
    period: null,
    rate: null,
    insuranceRate: null,
    fixedPeriod: null,
    variableRate: null  
  });

  currentLoanData = this.loanDataSource.asObservable();

  constructor() {
    this.loadDataFromCookie();
  }

  updateLoanData(data: Partial<LoanData>) {
    const newData = { ...this.loanDataSource.value, ...data };
    this.loanDataSource.next(newData);

    if (this.cookieService.hasConsent()) {
      this.cookieService.setCookie(this.loanDataCookieName, JSON.stringify(newData), 30);
    }
  }

  private loadDataFromCookie(): void {
    if (this.cookieService.hasConsent()) {
      const cookieData = this.cookieService.getCookie(this.loanDataCookieName);
      if (cookieData) {
        const parsedData: LoanData = JSON.parse(cookieData);
        this.loanDataSource.next(parsedData);
      }
    }
  }
}
