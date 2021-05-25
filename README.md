# DBaaS

This project was generated with [Angular CLI](https://github.com/angular/angular-cli).

## Declare Regions/Clusters

Add env variables for each region/cluster to host databases : 

    `REGIONS_{region uppercase}={region title}`
    `REGIONS_{region uppercase}_KUBECONFIG={kubeconfig file path}`
    `REGIONS_{region uppercase}_SC={storage class}`
    `REGIONS_{region uppercase}_VSC={volume snapshot class}`

## Development server

Run `npm run local` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Prod server

Run `npm run build` first.
Then run `npm run start` for a prod server. Navigate to `http://localhost:8080/

## Deploy

`oc new-app nodejs-14~https://github.com/fdavalo/shop-app-angular.git  --name=shop-app-angular`
or
`oc new-app quay.io/app-sre/ubi8-nodejs-10~https://github.com/fdavalo/shop-app-angular.git --name=shop-app-angular`

`oc expose service/shop-app-angular`

Then get your url from `oc get routes`

## Backend servers (products, users, orders)

By default, the backend servers will be served by a json-server.

You need to set a configmap to replace assets/config/config.json with your backend urls, or in dev, modify environment.ts file

Existing admin user is : 

admin@gmail.com:admin

Users can register and ready to create databases.
