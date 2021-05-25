import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {OrderService} from '../_services/order.service';
import {UserService} from '../_services/user.service';
import {Router} from '@angular/router';
import { Observable, interval, Subscription } from 'rxjs';
import { listenerCount } from 'process';

@Component({
  selector: 'app-order-list',
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.scss']
})

export class OrderListComponent implements OnInit {
  checkoutForm: FormGroup;
  orders: any;
  regions: any;
  services: any;
  region: string;
  service: string;
  name: string;
  password: string;
  type: string;
  refreshed: string;
  refresh;

  constructor(private userService: UserService,
              private formBuilder: FormBuilder,
              private orderService: OrderService,
              private router: Router) {
    this.orders = [];
    this.regions = {};
    this.services = {};
    this.checkoutForm = this.formBuilder.group({
      region: ['', [Validators.required]],
      service: ['', [Validators.required]],
      name: ['', [Validators.required]],
      password: ['', [Validators.required]],
      type: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.onLoad();
    //this.refresh = interval(5000).subscribe(num => this.onLoad());
  }

  onLoad() {
    this.refreshed = (new Date()).toLocaleDateString() + ", " + (new Date()).toLocaleTimeString();
    this.services = this.userService.getServices();
    this.userService.getRegions().subscribe(
      data => {
        this.regions = data;
        this.orderService.getOrders(this.userService.getSession()).subscribe(
          data => {
            this.orders = data;
        }, 
          error => {
            this.router.navigate(['/logout']);
            //this.refresh.unsubscribe();
        });    
    }, 
      error => {
        this.router.navigate(['/logout']);
        //this.refresh.unsubscribe();
    });    
  }

  onSubmit(data) {
    data.namespace = "dbaas-" + this.userService.getId().split('@')[0].replaceAll('.', '-') + "-" + data.service;
    data.namespace = data.namespace.toLowerCase();
    this.orderService.setOrder(data, this.userService.getSession()).subscribe(
      db => {
        this.onLoad();
      }, 
      error => {
        this.router.navigate(['/logout']);
        //this.refresh.unsubscribe();
    });
  }

  showDb(db) {
      this.router.navigate(['/orders/'+db.id]);
      //this.refresh.unsubscribe();
  }

  Refresh() {
    this.onLoad();
  }

  orderDate(order) {
    return (new Date(order.id)).toLocaleString();
  }

  listServices() {
    var liste = [];
    for (var key in this.services) {
      liste.push(key);
    }
    return liste;
  }

  listRegions() {
    var liste = [];
    for (var key in this.regions) {
      liste.push(key);
    }
    return liste;
  }
  
  serviceTitle(svc) {
    if (this.services[svc] == null) return "";
    return this.services[svc].title;
  }

  regionTitle(svc) {
    if (this.regions[svc] == null) return "";
    return this.regions[svc].title;
  }

  types() {
    return this.userService.getTypes();
  }
}
