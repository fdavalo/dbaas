import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {OrderListComponent} from './order/order-list.component';
import {OrderDetailsComponent} from './order/order-details.component';
import {LoginComponent} from './user/login.component';
import {LogoutComponent} from './user/logout.component';
import {ProfileComponent} from './user/profile.component';
import {AdminComponent} from './admin/admin.component';


const routes: Routes = [
  {path: '', component: OrderListComponent},
  {path: 'orders', component: OrderListComponent},
  {path: 'orders/:id', component: OrderDetailsComponent},
  {path: 'login', component: LoginComponent},
  {path: 'logout', component: LogoutComponent},
  {path: 'profile', component: ProfileComponent},
  {path: 'admin', component: AdminComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
