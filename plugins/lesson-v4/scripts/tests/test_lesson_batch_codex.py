import importlib.util
import json
import sys
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
spec = importlib.util.spec_from_file_location('batch_codex', Path(__file__).resolve().parents[1] / 'lesson-batch.py')
b = importlib.util.module_from_spec(spec)
spec.loader.exec_module(b)

def fixture(tmp_path, events):
    lesson = {'key':'one','host':'codex','brief':'Year 4 maths','log':'run.jsonl'}
    folder=b.batch_dir(tmp_path)/'one'
    folder.mkdir(parents=True)
    (folder/'run.jsonl').write_text('\n'.join(json.dumps(e) for e in events),encoding='utf-8')
    return lesson

def test_codex_reads_session_and_final_message(tmp_path):
    lesson=fixture(tmp_path,[{'type':'thread.started','thread_id':'exact-id'},
        {'type':'item.completed','item':{'type':'agent_message','text':'Finished'}},
        {'type':'turn.completed'}])
    got=b.read_session(tmp_path,lesson)
    assert got['session']=='exact-id' and got['report']=='Finished' and got['worked']

def test_codex_limit_then_success_clears_pause(tmp_path):
    lesson=fixture(tmp_path,[{'type':'turn.failed','error':{'message':'usage limit reached'}},
        {'type':'turn.completed'}])
    assert not b.read_session(tmp_path,lesson)['limited']

def test_codex_limit_without_reset_is_visible(tmp_path):
    lesson=fixture(tmp_path,[{'type':'turn.failed','error':{'message':'usage limit reached'}}])
    got=b.read_session(tmp_path,lesson)
    assert got['limited'] and got['resets'] is None

def test_codex_permission_failure_is_not_work(tmp_path):
    lesson=fixture(tmp_path,[{'type':'turn.failed','error':{'message':'Permission denied'}}])
    got=b.read_session(tmp_path,lesson)
    assert not got['worked'] and not got['limited'] and got['report']=='Permission denied'

def test_launch_keeps_backend_resume_id_and_prompt_off_command_line(tmp_path):
    lesson={'key':'one','tag':'Lesson one','host':'codex','brief':'Exact teacher text'}
    with patch.object(b,'codex_command',return_value=['codex.exe']), patch.object(b.subprocess,'Popen') as popen:
        popen.return_value.pid=1234
        b.start_session(tmp_path,lesson,'Continue the lesson','context',resume_session='specific-id')
        command=popen.call_args.args[0]
        assert command==['codex.exe','exec','--approve-for-me','--skip-git-repo-check','--json','resume','specific-id','-']
        assert lesson['host']=='codex'
        assert (b.batch_dir(tmp_path)/'one'/'teacher-brief.txt').read_text()=='Exact teacher text'

def test_route_selects_codex_without_changing_claude_consent(capsys):
    with patch.object(b,'codex_command',return_value=['codex.exe']), patch.object(b.plugin_settings,'read_settings',return_value={'batch':{'autoMode':'agreed'}}):
        b.codex_route()
    assert 'BATCH_AGREED=no' in capsys.readouterr().out

def test_expired_lock_does_not_enter_critical_section(tmp_path):
    import pytest
    with patch.object(b.time,'time',side_effect=[0,61]):
        with pytest.raises(TimeoutError):
            with b.batch_lock(tmp_path):
                raise AssertionError('entered without owning the lock')

def test_stored_codex_backend_survives_claude_environment(tmp_path):
    b.write_batch(tmp_path, {'host':'codex','lessons':[]})
    lesson={'key':'one','tag':'Lesson one','brief':'Exact teacher text'}
    with patch.dict(b.os.environ, {'LESSON_BATCH_HOST':'claude'}), patch.object(b,'codex_command',return_value=['codex.exe']), patch.object(b.subprocess,'Popen') as popen:
        popen.return_value.pid=1234
        b.start_session(tmp_path,lesson,'Continue','context')
        assert popen.call_args.args[0][0]=='codex.exe'
        assert lesson['host']=='codex'

def test_local_completion_requires_current_built_files(tmp_path):
    lesson={'brief':'Year 4 maths'}
    folder=tmp_path/'working'/'lesson-one'
    (folder/'build-results').mkdir(parents=True)
    (folder/'teacher-brief.txt').write_text(lesson['brief'])
    assert not b.local_artifacts_checked(tmp_path,lesson)
    artifact=tmp_path/'lesson.pptx'
    artifact.write_bytes(b'test artifact')
    record=folder/'build-results'/'slides.json'
    record.write_text(json.dumps({'ok':True,'outputs':[{'path':str(artifact),'sha256':b.hashlib.sha256(artifact.read_bytes()).hexdigest()}]}))
    assert b.local_artifacts_checked(tmp_path,lesson)
    lesson['firstStarted']='2099-01-01T00:00:00'
    assert not b.local_artifacts_checked(tmp_path,lesson)
    lesson.pop('firstStarted')
    artifact.write_bytes(b'changed')
    assert not b.local_artifacts_checked(tmp_path,lesson)
