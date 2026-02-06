# CRC Plan 

The following are the roughly priority ordered required updates before we can have a user try the CRC-Hub:

Maintained in project GitHub repo at: [docs/CRC-Plan.md](./CRC-Plan.md)

## TBD
- [ ] I believe we discussed with Jos in the past that Freon would auto create the single concept when you hit the '+ concept'. It doesn't work. The the only choice for '+ SystemAccesses' is a SystemAccess concept. I see the drop down when I click it rather than it just being created. I added a discussion on it to Freon. Is this something we'll fix ourselves?
- [ ] Copy and paste of language concepts only works on list elements. So you can't copy a schedule or checklist separately. Do we want to do something to support this vs. just copying the event? Need to discuss with Jos whether concepts should be selectable and then can be copied like in MPS. 


## Graham

### To-Do 
- [ ] Improve light-mode, e.g., add more contrast so things like patient date slider is visible. 
- [ ] Document and test the steps to bring on a user
- Not needed for first user:
  - [ ] Add a way to search the content of the study design better than just cntl-f in the browser?
  - [ ] Make staff shared/optionally-shared across studies (not essential for first user)
  - [ ] Make roles shared/optionally-shared across studies (not essential for first user)
  - [ ] Update what is displayed on Info / Help panel
  - [ ] Write/generate a simple user guide with focus on how to create a study design
  - [ ] Setup approach to testing new charts and other parts of the UI
  - [ ] Add tests

### In-Progress
- [ ] Deploy to Azure
- [ ] Create a dev/test instance on Azure
- [ ] Add patient page with visits / checklist, add note taking place
  - [ ] Add existing single patient full schedule chart to a draw / panel in the new UI

### Done
- [x] HTML editor: return and tab need to not jump out of editor
- [x] Improve validation error messages
- [x] Show Patients page when no patients to allow getting started on study
- [x] Make error messages jump to concept with error; also improved the message with context
- [x] Get undo-redo working again
- [x] Delete study from study page behavior
- [x] Error locator working (unless the content is hidden), with improved message
- [x] Custom action selector only shows a single outline with there are multiple in the hierarchy
- [x] '+' should expand if collapsed
- [x] change the 'Errors' tab to something friendlier, e.g., 'Issues', 'To-Do', 'Incomplete'
- [x] Investigate how Freon shows error under field to see if we can use it, e.g., box added errors for the item group name


## Mike

### To-Do 
- [ ] Create a repeatable demo script (whoever is done first will do this)
- [ ] review and update tests
- [ ] Setup tests of incomplete studies and add additional validation checks if/as needed so reliably get charts, etc.
- [ ] Not needed for first user but really need to know how well AI can generate a study DSL from a protocol document. Try with JSL protocol reader?


### In-Progress
- [ ] Rebuild some or all of the studies to test behavior and useability
- [ ] Create complex and realistic examples of checklists


### Done
- [x] Remove choice of the visit you are on when 'start when' is a reference. Needs custom scope added. 
- [x] Determine whether optional from Freon is needed and where: Does not seem to be needed in current UI
- [x] Make tasks be clickable checkboxes in a Word document
- [x] fix checklist hide/show for unscheduled event at study level
- [x] Fix ReferenceComponent:
  - [x] To display like SelectableListItemComponent
  - [x] Fix Jump to reference button to work again
- [x] Add back pdf/print behavior to checklist
- [x] - Get control-x, control-c, control-v working
- [x] Test, update, and add buttons for things like duplicate and smart duplicate, 
- [x] Make sure data entry of shared-tasks, shared-steps still work. Make sure they display in checklist like a non shared task 
- [x] Unscheduled and other special events
  - [x] Model unscheduled and other special events in the language in a better way.
  - [x] Add unscheduled event support to checklist
- [x] remove duplicate first scheduled choices 
- [x] Repeating Visits with occurrence on the schedule 
- [x] Finish Checklist display and printing as HTML: 
  - [x] Add Schedule and Checklist details
  - [x] Make links to systems be real html links
  - [x] Improve formatting overall
- [x] Update to current Freon version.
- [x] Get rid of the 'Notes' stuff, have only description and explore always having descriptions displayed. 
- [x] Review single event patient checklist that Jon created to determine if Graham can use it. -> It should be useable after the rest of the checklist display is cleaned-up 
- [x] make default study have 'day 0' as start when to avoid the error.


## Jon
- [ ] Add single event patient checklist to be displayed from the patient page and selected date. Use latest version of template somehow merged with template the Jon created.
- [ ] Add choice of template studies when creating a study

### To-Do 
- [ ]

### In-Progress
- [ ] Add multi-patient full schedule chart as an alternative view
- [ ] add back view of availability to chart

### Done
- [x] Copy a study feature
- [x] Review new UI implementation done by Graham...



## Other Old Notes:

- [ ] Ignore not-available-dates before first visit
- [ ] Demo:
- [ ] CRA Visit as a kind of event
- [ ] Add a payment milestone to study and charts somehow
- [ ] Need good examples of tasks and steps for demo
- [ ] In multi-patient chart what is the start and end date to use
- [ ] Review and fix smart created, e.g., 
- [ ] Make the name of the first visit be created smartly, e.g., if previous is V3 then make it V4.
- [ ] Make the name of the first event be ‘V#’ instead of copying the name of the period?
- [ ] Need a better symbol for the smart duplicate. The two down symbols looks like it’s for expand. Can we make it easier to expand using keyboard return or tab?
- [ ] Need a better way to allow something at study-start with a displacement time that doesn’t require to know what the ‘<choose>’ does and still reads well when you’ve added a displacement.  Does the trigger of = "plus or minus day/week/month/..." accomplish - [x] this?
- [ ] eventState of a EventReference is required. Either find a way to show it as an error or auto create it as ‘completed’
- [ ] Use the brackets view to show parens for an expression to highlight how the tree is interpreted.
- [ ] elated is the optional projection option in an editor: https://www.freon4dsl.dev/030_Developing_a_Language/020_Definition_Level/010_Editor_Definition/020_Projections see Optional Projections examples:
  - [ ] [?Helper functions:
            ${helpers vertical}]

- [ ] To emphasize the DSL style should we make it into a sentence like ‘this is a Site Visit that is also referred to as V1.”? Make the things that are choices styled differently so it’s clear you can tab into or click them to change. This makes it plus the schedule read like a textual description.
- [x] Try DSL style in more places?
- [x] If not DSL should they go on the same line?


- [x] Clean up wording of Repeats. Make ‘max’ be either ‘max’ or ‘exactly’ or some other way of expressing it.
- [x] Change wording of window so at-most reads better and it’s clear it’s an outer vs. the inner window. Get words from graham, e.g., compliant. Maybe have a way to hide the outer window.
 

- [x] Consider a +/- time so only need one number to enter
- [x] Mixing up ‘completed’ vs. ‘each completed’ is a good demo scenario.
- [x] Default Name of Period should not be ‘Period’. Maybe ‘Unnamed’ so clear that it isn’t named and easy to delete the word.
- [x] Try CRC on phone
- [x] Should we record who saw patient
- [x] It is easy to accidentally delete your parent. Undo helps when you make this mistake. Need to look into making more things not delectable, e.g., the entire schedule element shouldn’t be delete-able.  Ask Jos if they are considering adding modifiers to the edit file for things like canDelete, what to do on return, etc.
- [x] Enter a new Period/Event/etc., enter the name, it is not expanded, and you need to tab backwards to get to the expand/collapse. Could/should it be auto expanded when you create new?  I think you liked the idea of adding a bunch of elements and then going
- [x] into the details. Maybe whether it is expanded when you create is a user option.  Maybe have a second expand/collapse at the end to make it easy to tab to it after creating—this introduces an extra tab needed to move along which isn’t ideal. Could we put it there dynamically when you exit from entering the name field? Only shows when you change the name and it isn’t already expanded. This appears to be fixed or a non-issue.
- [x] Delete key in a number field deletes the concept instead of the digit unless you double click mouse to select the thing to be deleted Appears to be fixed