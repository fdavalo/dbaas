import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';
import { AppConfigService } from '../providers/app-config.service';
import { isDevMode } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  backendUrl: string; // = environment.orderUrl;

  constructor(private http: HttpClient, private config: AppConfigService) {
    if (isDevMode()) this.backendUrl = environment.orderUrl;
    else this.backendUrl = this.config.getConfig()['orderUrl'];
  }

  getOrders(session) {
    const url = this.backendUrl + '/databases';
    var options = {"headers":{"ApiSession":session}};    
    return this.http.get(url, options);
  }

  getOrder(id, session) {
    const url = this.backendUrl + '/databases/' + id;
    var options = {"headers":{"ApiSession":session}};    
    return this.http.get(url, options);
  }

  setOrder(data, session) {
    const url = this.backendUrl + '/databases';
    var options = {"headers":{"ApiSession":session}};    
    return this.http.post(url, data, options);
  }

  addSnapshot(id, session) {
    const url = this.backendUrl + '/databases/'+id+'/snapshot';
    var options = {"headers":{"ApiSession":session}};    
    return this.http.post(url, {}, options);
  }

  deleteSnapshot(id, sid, session) {
    const url = this.backendUrl + '/databases/'+id+'/snapshot/' + sid;
    var options = {"headers":{"ApiSession":session}};    
    return this.http.delete(url, options);
  }

  recoverSnapshot(id, sid, session) {
    const url = this.backendUrl + '/databases/'+id+'/snapshot/' + sid;
    var options = {"headers":{"ApiSession":session}};    
    return this.http.post(url, {}, options);
  }

  deleteOrder(id, session) {
    const url = this.backendUrl + '/databases/' + id;
    var options = {"headers":{"ApiSession":session}};    
    return this.http.delete(url, options);
  }
}
