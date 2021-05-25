NS=$1
APP=$2
PWD=$3
SVC=$4
DIR=data/$NS-$APP

oc new-project $NS 2>/dev/null

oc project $NS >/dev/null
ret=$?
if [[ $ret -ne 0 ]]; then echo "Could not use namespace $NS"; exit 1; fi

mkdir -p $DIR
sed -e "s/\${ns}/$NS/g" roles.yaml > $DIR/roles.yaml
sed -e "s/\${app}/$APP/g" -e "s/\${type}/$TYPE/g" -e "s/\${sc}/$SC/g" $TYPE/deployment.yaml > $DIR/deployment.yaml
sed -e "s/\${app}/$APP/g" -e "s/\${type}/$TYPE/g" $TYPE/service.yaml > $DIR/service.yaml
sed -e "s/\${app}/$APP/g" -e "s/\${type}/$TYPE/g" -e "s/\${password}/$(echo -n $PWD | base64)/g" user.yaml > $DIR/user.yaml
sed -e "s/\${app}/$APP/g" -e "s/\${type}/$TYPE/g" -e "s/\${sc}/$SC/g" -e "s/\${vsc}/$VSC/g" backup-$SVC.yaml > $DIR/backup.yaml

oc apply -f $DIR/user.yaml -f $DIR/deployment.yaml -f $DIR/service.yaml -f $DIR/roles.yaml -f $DIR/backup.yaml >> $DIR/out.log 2>&1
ret=$?
if [[ $ret -ne 0 ]]; then echo "Could not create database"; exit 1; fi

oc expose svc $APP-$TYPE --port=db >> $DIR/out.log 2>&1
ret=$?
if [[ $ret -ne 0 ]]; then echo "Could not expose database"; exit 1; fi

oc expose svc $APP-$TYPE-admin --port=http >> $DIR/out.log 2>&1
ret=$?
if [[ $ret -ne 0 ]]; then echo "Could not expose database admin"; exit 1; fi

