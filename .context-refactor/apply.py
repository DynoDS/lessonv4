from pathlib import Path
import hashlib,json,sys,shutil
ROOT=Path(sys.argv[1]).resolve();P=ROOT/'plugins/lesson-v4';path=P/'agents/lesson-designer.md'
original=path.read_text();text=original;moves=[];sections=[]

def move(title,start,end,replacement):
 global text
 assert original.count(start)==1 and original.count(end)==1,(title,start,end)
 a=original.index(start);b=original.index(end,a);block=original[a:b]
 assert text.count(block)==1,title
 text=text.replace(block,replacement+'\n\n',1)
 sections.append((title,block))
 moves.append({'section':title,'start':start,'end':end,'originalBytes':len(block.encode()),'sha256':hashlib.sha256(block.encode()).hexdigest(),'retainedVerbatim':True})

move('Dialogic route', '**Dialogic:** Objective requires', '**Task-Centred:** Built around',
     'When Dialogic is a candidate, read `lesson-designer-components.md` → Dialogic route before committing the structure. Its open-question, grounding, safety and synthesis boundaries still apply; a subject label does not choose the route.')
move('Task-Centred route', '**Task-Centred:** Built around', '**Writing lesson turns on whether',
     'When Task-Centred is a candidate, read `lesson-designer-components.md` → Task-Centred route before committing the structure, including when distinguishing one sustained task from repeated skill practice. Keep the writing-form boundary below in view.')
# Keep the representation-selection prerequisite in core; defer configuration mechanics only.
start='**Families, not single objects - pick config deliberately.**'
end='**Modelling resource state:**'
move('Representation configurations',start,end,
     'Before specifying or changing a representation configuration, read `lesson-designer-components.md` → Representation configurations. This applies to diagrams, tables, maps and other helpers in any subject, including deciding what stays blank, what is paired, and how many figures a task needs. A lesson with no such representation leaves this section unread; modelling-state and exact-instance guidance below still applies.')
move('Generated worksheet', '**Design independent activity before content or surface.**', '**Your picture budget is 16 across the whole design.**',
     'For a generated worksheet, read `lesson-designer-components.md` → Generated worksheet before choosing its activity, examples, shape, support or page-fit priorities. Read it again only under the context-reuse rule when revising those decisions. A teacher-supplied base sheet keeps the suitability, coverage and non-duplication checks above; its Below/Greater Depth adaptation still runs with the Adaptation Designer. Do not load generated-sheet authoring merely to inspect a supplied sheet.')
# Keep web research and eligibility/core visual guidance out of the conditional acquisition section.
move('Photograph acquisition', '**Choosing the acquisition mode.**', '**Search the web whenever it makes the lesson better.**',
     'When a required photograph is being considered, read `lesson-designer-components.md` → Photograph acquisition before committing the visual plan or authoring its contract. Judge availability, authenticity and fallback together; do not wait until after selecting an acquisition mode. This applies in Maths too, and to repairs that introduce a photograph.')
# Non-contiguous second half becomes same selected acquisition section, no repeated first half.
a=original.index('**Name the evidence, not the file.**');b=original.index('**Never photograph a tool the engine draws.**',a)
block=original[a:b];assert text.count(block)==1
text=text.replace(block,'',1)
i=next(i for i,(title,_) in enumerate(sections) if title=='Photograph acquisition')
sections[i]=(sections[i][0], sections[i][1]+block)
moves.append({'section':'Photograph acquisition','start':'**Name the evidence, not the file.**','end':'**Never photograph a tool the engine draws.**','originalBytes':len(block.encode()),'sha256':hashlib.sha256(block.encode()).hexdigest(),'retainedVerbatim':True})
# Establish one source of the five entry-condition menu: the mandatory existing reader.
start='| Structure | Use when |';a=text.index(start);b=text.index('**Skill-based:**',a)
menu=text[a:b]
text=text[:a]+'Use all five entry conditions returned by the mandatory `--structure-menu` read. They are the selection menu, not a substitute for the candidate-specific boundaries below or the subject file.\n\n'+text[b:]
# Canonical loading section owns the reference's activation; named point-of-use sections own conditions.
needle='- Read `modelling-formats.md` when choosing `modellingState`.'
assert text.count(needle)==1
text=text.replace(needle,'- Read only the triggered section of `lesson-designer-components.md` at the decision points named above: Dialogic route, Task-Centred route, Representation configurations, Generated worksheet or Photograph acquisition. Use the existing exact-section reader and batch sections needed together. Do not open this component file in full or load it at startup.\n'+needle)
text=text.replace('6. This agent for cross-subject lesson-design decisions.', '6. This agent for cross-subject lesson-design decisions, including its delegated `lesson-designer-components.md` sections.',1)
path.write_text(text, encoding="utf-8")
new_ref='# Lesson Designer: conditional component guidance\n\nThese sections retain the Lesson Designer\'s detailed instructions. The main role owns activation and authority; read the applicable section before its decision, not this file in full. Shared lesson, wording, visual-need and safety rules remain in the main role and existing references.\n\n'
for title,block in sections:new_ref+='## '+title+'\n\n'+block
new_ref+='---\n'
(P/'references/lesson-designer-components.md').write_text(new_ref, encoding="utf-8")
# Proof at implementation time: every moved byte survived once, without paraphrase.
for m in moves:
 a=original.index(m['start']);b=original.index(m['end'],a);block=original[a:b]
 assert new_ref.count(block)==1,m
 assert block not in text,m
assert original.split('---',2)[1]==text.split('---',2)[1]

from pathlib import Path
import ast
root=P/'scripts/tests'
def edit_functions(filename, changes):
 p=root/filename;s=p.read_text();tree=ast.parse(s);lines=s.splitlines(keepends=True)
 edits=[]
 for name,old,new in changes:
  matches=[n for n in ast.walk(tree) if isinstance(n,(ast.FunctionDef,ast.AsyncFunctionDef)) and n.name==name]
  assert len(matches)==1,(filename,name)
  n=matches[0];part=''.join(lines[n.lineno-1:n.end_lineno]);assert part.count(old)==1,(filename,name,old)
  edits.append((n.lineno-1,n.end_lineno,part.replace(old,new)))
 for a,b,new in sorted(edits,reverse=True):lines[a:b]=[new+'\n' if not new.endswith('\n') else new]
 s=''.join(lines)
 if any('component_text(' in new for _,_,new in changes):
  s=s.replace('from pathlib import Path\n','from pathlib import Path\n\nfrom reference_test_support import component_text\n',1)
 p.write_text(s)
flat='" ".join(component_text("Generated worksheet").split())'
edit_functions('test_brief_absorption_and_unrouted_rules.py',[
 ('test_freshness_does_not_permit_changing_the_medium','flat(LESSON_DESIGNER)',flat)])
edit_functions('test_response_length_and_circular_definitions.py',[(name,'flat(LESSON_DESIGNER)',flat) for name in ('test_response_sizes_the_space_rather_than_setting_a_quota','test_the_rule_names_when_a_length_is_legitimate','test_the_rule_gives_a_checkable_tell')])
edit_functions('test_needed_is_not_tidy.py',[
 ('test_designer_and_contract_refuse_the_covered_by_the_final_section_reason','flat(LESSON_DESIGNER)',flat)])
edit_functions('test_picture_requirements_are_gettable.py',[(name,'flat(DESIGNER)','flat(component_text("Photograph acquisition"))') for name in ('test_the_ladder_order_is_the_compilers_and_follows_the_picture','test_the_designer_names_the_evidence_and_the_scout_fetches_it','test_a_specific_archive_item_is_now_a_fair_thing_to_ask_for','test_the_designer_knows_how_far_the_route_reaches')])
edit_functions('test_make_lesson_static_contract.py',[
 ('test_stage1_dialogic_synthesis_required','(ROOT / "agents" / "lesson-designer.md").read_text(encoding="utf-8")','component_text("Dialogic route")'),
 ('test_stage1_support_fading_summary','(ROOT / "agents" / "lesson-designer.md").read_text(encoding="utf-8")','component_text("Generated worksheet")'),
 ('test_lesson_designer_prices_the_protected_set_against_the_page','self._designer_text()','component_text("Generated worksheet")'),
 ('test_preferences_are_loaded_by_named_section','Read a named section from its heading to the next heading of the same level.','stops before the next heading at the same or a higher level.')])
edit_functions('test_picture_ladder_sources.py',[
 ('test_the_designer_is_told_a_named_object_is_not_staging','(ROOT.parent / "agents" / "lesson-designer.md").read_text(encoding="utf-8")','component_text("Photograph acquisition")')])
# The reference guard must inspect module links without mistaking module text for the loading policy.
p=root/'test_lesson_designer_loading_guard.py';s=p.read_text();s=s.replace('from pathlib import Path\n','from pathlib import Path\n\nfrom reference_test_support import component_text\n',1)
s=s.replace('\ndef loading_section(text: str) -> str:', '\ndef all_guidance_text() -> str:\n    return role_text() + "\\n" + "\\n".join(component_text(name) for name in (\n        "Dialogic route", "Task-Centred route", "Representation configurations",\n        "Generated worksheet", "Photograph acquisition",\n    ))\n\n\ndef loading_section(text: str) -> str:')
s=s.replace('text = role_text()\n        section = loading_section(text)','text = all_guidance_text()\n        section = loading_section(role_text())')
s=s.replace('text = role_text()\n        unresolved = []','text = all_guidance_text()\n        unresolved = []')
p.write_text(s)

# Copy only the reviewed new test/evaluation files supplied with this proposal.
proposal=Path(__file__).resolve().parent
expected=json.loads((proposal/'expected.json').read_text(encoding='utf-8'))
for rel in expected['copyFiles']:
    target=ROOT/rel
    if target.exists():
        raise RuntimeError(f"refusing existing new file: {rel}")
    target.parent.mkdir(parents=True,exist_ok=True)
    target.write_bytes((proposal/'files'/rel).read_bytes())
for rel,digest in expected['sha256'].items():
    actual=hashlib.sha256((ROOT/rel).read_bytes()).hexdigest()
    if actual!=digest:
        raise RuntimeError(f"candidate differs from tested bytes: {rel}")
print('CANDIDATE_BYTES_OK')
