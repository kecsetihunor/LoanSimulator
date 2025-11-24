import { Routes } from '@angular/router';
import { SimpleCalculatorComponent } from '@features/simple-calculator/simple-calculator.component';
import { AdvancedCalculatorComponent} from '@app/features/advanced-calculator/advanced-calculator.component';
import { RepaymentCalculatorComponent } from '@features/repayment-calculator/repayment-calculator/repayment-calculator.component';
import { AboutComponent } from './features/about/about.component';

export const routes: Routes = [
  { 
    path: '', 
    redirectTo: 'simple', 
    pathMatch: 'full' 
  },
  {
    path: 'simple',
    component: SimpleCalculatorComponent
  },
  {
    path: 'advanced',
    component: AdvancedCalculatorComponent
  },
  {
    path: 'repayment',
    component: RepaymentCalculatorComponent
  },
    {
    path: 'about',
    component: AboutComponent
  }
];
