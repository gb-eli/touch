package br.com.agv.touch.filamentlab;
public final class FrameStatsTest {
 public static void main(String[] args){
  FrameStats s=new FrameStats();s.frame(1000000000L,true);s.frame(1010000000L,true);s.frame(1020000000L,false);s.frame(1040000000L,true);
  if(s.accepted()!=3||s.skipped()!=1||Math.abs(s.fps()-50)>0.001||s.p95ms()!=30)throw new AssertionError("cadence");
  s.reset();if(s.accepted()!=0||s.fps()!=0||s.p95ms()!=0)throw new AssertionError("reset");
  System.out.println("FrameStats contract passed");
 }
}
