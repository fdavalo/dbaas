NS=$1
APP=$2
ID=$3
DIR=data/$NS-$APP

oc new-project $NS 2>/dev/null

oc project $NS >/dev/null
ret=$?
if [[ $ret -ne 0 ]]; then echo "Could not use namespace $NS"; exit 1; fi

mkdir -p $DIR
sed -e "s/\${app}/$APP/g" -e "s/\${type}/$TYPE/g" -e "s/\${id}/$ID/g" -e "s/\${sc}/$SC/g" recover.yaml > $DIR/recover.yaml
sed -e "s/\${app}/$APP/g" -e "s/\${type}/$TYPE/g" -e "s/\${id}/$ID/g" $TYPE/patch.yaml > $DIR/patch.yaml

oc apply -f $DIR/recover.yaml >> $DIR/out.log 2>&1

sleep 1 

oc patch deployment $APP-$TYPE -n $NS --type merge --patch "$(cat $DIR/patch.yaml)" >> $DIR/out.log 2>&1

