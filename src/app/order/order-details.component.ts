import {Component, OnInit} from '@angular/core';
import {OrderService} from '../_services/order.service';
import {UserService} from '../_services/user.service';
import {Router} from '@angular/router';
import {ActivatedRoute} from '@angular/router';
import { Observable, interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-order-details',
  templateUrl: './order-details.component.html',
  styleUrls: ['./order-details.component.scss']
})
export class OrderDetailsComponent implements OnInit {
  db;
  regions: any;
  services: any;
  refreshed: string;
  refresh;

  constructor(private userService: UserService,
              private orderService: OrderService,
              private router: Router,
              private route: ActivatedRoute) {
                this.db = {"name":"", "region":"","service":"","type":"", "status":"", "id":0, "snapshots":[], "urlDb":"", "urlAdmin":""};
                this.regions = {};
                this.services = {};
  }

  ngOnInit(): void {
    this.onLoad();
    //this.refresh = interval(5000).subscribe(num => this.onLoad());
  }

  onLoad() {
    this.services = this.userService.getServices();
    this.userService.getRegions().subscribe(
      data => {
        this.regions = data;
        this.route.params.subscribe(
          params => {
            this.orderService.getOrder(params['id'], this.userService.getSession()).subscribe(
              data => {
                this.db = data;
                if (data["type"] == "mysql") data["loginAdmin"] = "root";
                else if (data["type"] == "postgres") data["loginAdmin"] = "root@localhost.com";
                else data["loginAdmin"] = "?";
                data['refreshed'] = (new Date()).toLocaleDateString() + ", " + (new Date()).toLocaleTimeString();
              }, 
              error => {
                this.router.navigate(['/']);
                this.refresh.unsubscribe();
              }
            )
          },    
          error => {
            this.router.navigate(['/logout']);
            this.refresh.unsubscribe();
          }
        );
      }, 
      error => {
        this.router.navigate(['/logout']);
        this.refresh.unsubscribe();
    });
  }

  onDelete() {
    this.orderService.deleteOrder(this.db.id, this.userService.getSession()).subscribe(
      db => {
        this.router.navigate(['/']);
        this.refresh.unsubscribe();
      },
      error => {
        this.router.navigate(['/logout']);
        this.refresh.unsubscribe();
      }
    );
  }

  onRefresh() {
    this.onLoad();
  }

  onSnapshot() {
    this.orderService.addSnapshot(this.db.id, this.userService.getSession()).subscribe(
      db => {
        this.onLoad();
      },
      error => {
        this.router.navigate(['/logout']);
        this.refresh.unsubscribe();
      }
    );
  }

  orderDate(id) {
    return (new Date(parseInt((""+id)))).toLocaleString()
  }

  showUrl(url) {
    if (url) return "http://"+url;
    else return "http://?";
  }  

  deleteSnapshot(db, snapshot) {
    this.orderService.deleteSnapshot(this.db.id, snapshot.id, this.userService.getSession()).subscribe(
      db => {
        this.onLoad();
      },
      error => {
        this.router.navigate(['/logout']);
        this.refresh.unsubscribe();
      }
    );
  }
  
  recoverDb(db, snapshot) {
    this.orderService.recoverSnapshot(this.db.id, snapshot.id, this.userService.getSession()).subscribe(
      db => {
        this.onLoad();
        //this.router.navigate(['/orders/'+this.db.id]);
        //this.refresh.unsubscribe();
      },
      error => {
        this.router.navigate(['/logout']);
        this.refresh.unsubscribe();
      }
    );
  }

  ready(snapshot) {
    if (! snapshot['ready']) return false;
    if (snapshot['ready'] == "true") return true;
    return false;
  }

  recovered(db) {
    if (db["recovered"]) {
      return true;
    }
    return false;
  }

  serviceTitle(svc) {
    if (this.services[svc] == null) return "";
    return this.services[svc].title;
  }

  regionTitle(svc) {
    if (this.regions[svc] == null) return "";
    return this.regions[svc].title;
  }

}
