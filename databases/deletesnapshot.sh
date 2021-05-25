NS=$1
APP=$2
ID=$3
DIR=data/$NS-$APP

oc project $NS >/dev/null
ret=$?
if [[ $ret -ne 0 ]]; then echo "Could not use namespace $NS"; exit 1; fi

oc delete volumesnapshot/$APP-$TYPE-$ID -n $NS >> $DIR/out.log 2>&1

