package br.com.agv.touch.filamentlab;
import java.util.Arrays;
/** Counts submitted frames; does not claim GPU completion or display presentation. */
public final class FrameStats {
    private final long[] intervals=new long[4096];
    private int size,accepted,skipped;
    private long first,last;
    public void reset(){size=accepted=skipped=0;first=last=0;}
    public void frame(long time,boolean submitted){
        if(!submitted){skipped++;return;}
        if(accepted==0)first=time;
        else if(time>last&&size<intervals.length)intervals[size++]=time-last;
        last=time;accepted++;
    }
    public int accepted(){return accepted;}
    public int skipped(){return skipped;}
    public double fps(){return accepted>1&&last>first?(accepted-1)*1e9/(last-first):0;}
    public double fpsForDuration(double seconds){if(!Double.isFinite(seconds)||seconds<=0)throw new IllegalArgumentException("duration");return accepted/seconds;}
    public double p95ms(){if(size==0)return 0;long[] copy=Arrays.copyOf(intervals,size);Arrays.sort(copy);return copy[(int)Math.ceil(size*.95)-1]/1e6;}
}
