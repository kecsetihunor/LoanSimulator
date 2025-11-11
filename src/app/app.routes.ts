import { Routes } from '@angular/router';
import { SimpleCalculatorComponent } from '@features/simple-calculator/simple-calculator.component';
import { AdvancedCalculatorComponent} from '@features/advanced-calculator/advanced-calculator/advanced-calculator.component';

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
  }
];
