NS=$1
APP=$2

oc project $NS >/dev/null
ret=$?
if [[ $ret -ne 0 ]]; then echo "Could not use namespace $NS"; exit 1; fi

oc get deployment/$APP-$TYPE -n $NS 2>/dev/null | awk '{if ($1=="'$APP'-'$TYPE'") print $2;}'
oc get route/$APP-$TYPE -n $NS 2>/dev/null | awk '{if ($1=="'$APP'-'$TYPE'") print $2;}'
oc get svc/$APP-$TYPE -n $NS 2>/dev/null | awk '{if ($1=="'$APP'-'$TYPE'") print $5;}' | awk -F/ '{print $1;}' | awk -F: '{print $2;}'
oc get route/$APP-$TYPE-admin -n $NS 2>/dev/null | awk '{if ($1=="'$APP'-'$TYPE'-admin") print $2;}'

oc get volumesnapshot -n $NS 2>/dev/null | awk '{if (index($1,"'$APP'-'$TYPE'-")==1) print "snapshot "$1" "$2" "$4;}'

