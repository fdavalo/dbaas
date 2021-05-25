NS=$1
APP=$2
DIR=data/$NS-$APP

oc project $NS >/dev/null

ret=$?
if [[ $ret -ne 0 ]]; then echo "Could not use namespace $NS"; exit 1; fi

oc delete deployment/$APP-$TYPE -n $NS 
oc delete route/$APP-$TYPE -n $NS 
oc delete svc/$APP-$TYPE -n $NS 
oc delete route/$APP-$TYPE-admin -n $NS
oc delete svc/$APP-$TYPE-admin -n $NS
oc delete pvc/$APP-$TYPE-pvc -n $NS

oc get pvc -n $NS | awk '{if (index($1,"'$APP'-'$TYPE'-")==1) system("oc delete pvc/"$1" -n '$NS'");}' >> $DIR/out.log 2>&1

oc get volumesnapshot  -n $NS | awk '{if (index($1,"'$APP'-'$TYPE'-")==1) system("oc delete volumesnapshot/"$1" -n '$NS'");}' >> $DIR/out.log 2>&1
