import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';
import { AppConfigService } from '../providers/app-config.service';
import { isDevMode } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  backendUrl: string; // = environment.userUrl;
  cache = {'session':null,'id':null};
  services = {
    "Or":{"title":"Or : backup chaque heure - réplication inter-région"},
    "Argent":{"title":"Argent : backup chaque heure"},
    "Bronze":{"title":"Bronze : backup chaque jour"}         
  };
  types = ["mysql","postgres"];
  regions = {
    "ocpk2":{"title":"docaposte fr paris"}, 
    "ocpk1":{"title":"docaposte fr nord"}
  };

  constructor(private http: HttpClient, private config: AppConfigService) {
      this.load();
      if (isDevMode()) this.backendUrl = environment.userUrl;
      else this.backendUrl = this.config.getConfig()['userUrl'];
  }

  load() {
    if (localStorage.getItem('UserService')) this.cache = JSON.parse(localStorage.getItem('UserService'));
  }

  save() {
    localStorage.setItem('UserService', JSON.stringify(this.cache));       
  }

  login(input) {
    const url = this.backendUrl + '/login';
    return this.http.post(url, input);
  }

  loggedIn(result, login) {
      this.cache.session = result['session'];
      this.cache.id = login;
      this.save();
  }

  loggedOut() {
      this.cache.session = null;
      this.cache.id = null;
      this.save();
  }

  getId() {
      return this.cache.id;
  }

  getSession() {
    return this.cache.session;
  }

  getUser() {
    const url = this.backendUrl + '/users/' + this.cache.id;
    var options = {"headers":{"ApiSession":this.cache.session}};
    return this.http.get(url, options);
  }

  updateUser(data) {
    const url = this.backendUrl + '/users/' + this.cache.id;
    var options = {"headers":{"ApiSession":this.cache.session}};
    return this.http.put(url, data, options);
  }

  register(data) {
    const url = this.backendUrl + '/users';
    return this.http.post(url, data);
  }

  getServices() {
    return this.services;
  }

  getRegions() {
    const url = this.backendUrl + '/regions';
    return this.http.get(url);
  }

  getTypes() {
    return this.types;
  }
}
