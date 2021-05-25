NS=$1
APP=$2
ID=$3
DIR=data/$NS-$APP

oc new-project $NS 2>/dev/null

oc project $NS >/dev/null
ret=$?
if [[ $ret -ne 0 ]]; then echo "Could not use namespace $NS"; exit 1; fi

PVC=`oc get deployment/$APP-$TYPE -o custom-columns=PVC:.spec.template.spec.volumes[].persistentVolumeClaim.claimName | tail -1`

mkdir -p $DIR
sed -e "s/\${app}/$APP/g" -e "s/\${type}/$TYPE/g" -e "s/\${id}/$ID/g" -e "s/\${vsc}/$VSC/g" -e "s/\${pvc}/$PVC/g" snapshot.yaml > $DIR/snapshot.yaml

oc apply -f $DIR/snapshot.yaml >> $DIR/out.log 2>&1

