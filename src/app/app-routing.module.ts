import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { StatisticsComponent } from './statistics/statistics.component';

const routes: Routes = [
  { path: ':lang/stats', component: StatisticsComponent },
  { path: ':lang', component: AppComponent }
];


@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
