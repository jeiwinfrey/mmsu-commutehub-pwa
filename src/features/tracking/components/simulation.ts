import { distanceMeters, type Coordinate } from "@/lib/commute-catalog";
import { pointOnPath } from "@/components/maps/road-path";
export type MotionState={meters:number;notified:boolean;notificationCount:number;seconds:number};
export function advanceMotion(previous:MotionState,meters:number,seconds:number,points:readonly Coordinate[],distances:readonly number[],pickup:Coordinate,pickupDistance:number,radius:number):MotionState{
 const nextMeters=Math.max(0,meters);const position=pointOnPath(points,distances,nextMeters);
 // A segment crossing prevents a small radius from being skipped by accelerated playback.
 const crossed=previous.meters<pickupDistance-radius&&nextMeters>=pickupDistance-radius;
 const inside=distanceMeters(position,pickup)<=radius;
 const entry=!previous.notified&&(inside||crossed)&&previous.meters<=pickupDistance&&nextMeters<=pickupDistance+80;
 return {meters:nextMeters,seconds:previous.seconds+seconds,notified:previous.notified||entry,notificationCount:previous.notificationCount+(entry?1:0)};
}
