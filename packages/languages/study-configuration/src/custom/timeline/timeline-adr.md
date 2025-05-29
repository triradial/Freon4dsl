## Scheduling

### First day of the schedule

There are multiple options for how to number the days on a trial and relate them to actual dates that hinge on whether the schedule in the DSL is expressed as 'Day 0' or 'Day 1' as the first day of the trial. Based on this the user must specify the schedule to consistently use zero or one based day numbers. It is an open question whether users need / want to write 'day 0'. See [Study day calculation for DAY 0 visit](https://www.pinnacle21.com/forum/study-day-calculation-day-0-visit#:~:text=According%20to%20the%20FDA%2C%20there,is%20day%20%22%2D1%22.) for some discussion on this topic. The design / requirements decision is that the DSL must support both. 


On a chart showing days and with the schedule in the DSL written using zero as the first day, the calculation for the date the chart starts on is:

``` Start Date + day-number-in-schedule

While if the schedule in the DSL is written using 'day 1' it's: 

``` Start Date + day-number-in-schedule - 1

More specifically for 'day 0' style scheduling, if the schedule starts on Jan 1 and the first visit is on day 0 then the date of that first visit is:

``` Jan 1 + 0

While for 'day 1' style scheduling, if the schedule starts on Jan 1 and the first visit is on day 1 then the date of that first visit is:

``` Jan 1 + 1 - 1

The code uses a configuration value, `dayOffsetOfFirstEventInstance`, which is set to 0 if the scheduling is written using 'day 0' as the first day and 1 for 'day 1' scheduling.

So the formula if the schedule starts on Jan 1 and the first visit is on day 1 then the date of that first visit is:

``` Jan 1 + 1 - dayOffsetOfFirstEventInstance

where dayOffsetOfFirstEventInstance has been configured to 1. For day 0 scheduling dayOffsetOfFirstEventInstance is configured to 0. This configuration is done via the studyStartDayNumber field in the DSL. 