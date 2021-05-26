# DBaaS

This project was generated with [Angular CLI](https://github.com/angular/angular-cli).

## Declare Regions/Clusters

Add env variables for each region/cluster to host databases : 

    `REGIONS_{region uppercase}={region title}`
    `REGIONS_{region uppercase}_KUBECONFIG={kubeconfig file path}`  --> do not specify KUBECONFIG if using serviceaccount in pod
    `REGIONS_{region uppercase}_SC={storage class}`
    `REGIONS_{region uppercase}_VSC={volume snapshot class}`

## Development server

Run `npm run local` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Prod server

Run `npm run build` first.
Then run `npm run start` for a prod server. Navigate to `http://localhost:8080/

## Deploy

`oc new-project dbaas`
then
`oc apply -f manifests/[imagestream.yaml, buildconfig.yaml]`
then
`oc start-build dbaas-1-0-1 --wait=true --follow=true`
then
`oc apply -f manifests/[serviceaccount.yaml, clusterrolebinding.yaml, configmap.yaml, deployment.yaml, service.yaml]`
then
`oc expose service/dbaas-1-0-1`

Then get your url from `oc get routes`

If you do not want to build the image, you can use this image `quay.io/fdavalo/utils:dbaas-1.0.1` and change it in deployment.yaml

## Backend servers (databases, users, sessions)

By default, the backend servers will be served by a json-server.

You need to set a configmap to replace assets/config/config.json with your backend urls, or in dev, modify environment.ts file

Existing admin user is : 

admin@gmail.com:admin

Users can register and ready to create databases.

For persistence of data, change in deployment.yaml from emptydir to a PVC