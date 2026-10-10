import { ControllerView } from '../components/ControllerView';
import { Segmented } from '../components/Segmented';
import { useControls } from '../content/hooks';
import { MODELS } from '../controllers/models';
import { bindingRows, howLabel, pickView, unusedInputs, type ViewKey } from '../logic/controls';
import { formatBuilt, pageTitle } from '../shell/paths';
import { useRobot } from '../shell/robot-context';
import { useUrlState } from '../shell/url-state';
import styles from './Controls.module.css';

export default function Controls() {
  const robot = useRobot();
  const data = useControls(robot.id);
  const { params, hash, update } = useUrlState();
  const doc = data.controllers.find((c) => c.id === hash.replace(/^#/, '')) ?? data.controllers[0];
  const model = MODELS[doc.model];
  const view = pickView(params.get('view'));
  const code = params.get('detail') === 'code';
  const wanted = params.get('input');
  const selected = wanted && model.inputs.some((n) => n.id === wanted) ? wanted : null;
  const rows = bindingRows(doc, model);
  const unused = unusedInputs(doc, model);
  const bindings = new Map(doc.bindings.map((b) => [b.input, b]));
  const select = (id: string) => update({ set: { input: id === selected ? null : id } });

  return (
    <div className={styles.page}>
      <title>{pageTitle('Controls', robot.name)}</title>
      <div className={styles.side}>
        <header className={styles.head}>
          <p className={styles.eyebrow}>{robot.name}</p>
          <h1 className={styles.h1}>Controls</h1>
          <p className={styles.lead}>What each button on the driver station controllers does.</p>
          <div className={styles.switches}>
            <Segmented label="Controller" name="controller" value={doc.id}
              options={data.controllers.map((c) => ({ value: c.id, label: c.name }))}
              onChange={(id) => update({ hash: `#${id}`, set: { input: null } })} />
            <div className={styles.pair}>
              <Segmented<ViewKey> label="View" name="view" value={view}
                options={[{ value: 'front', label: model.views.front.title }, { value: 'back', label: model.views.back.title },
                  { value: '3d', label: '3D' }]}
                onChange={(v) => update({ set: { view: v === 'front' ? null : v } })} />
              <Segmented label="Detail" name="detail" value={code ? 'code' : 'plain'}
                options={[{ value: 'plain', label: 'Plain' }, { value: 'code', label: 'Code' }]}
                onChange={(v) => update({ set: { detail: v === 'code' ? 'code' : null } })} />
            </div>
          </div>
        </header>

        <section className={styles.text} aria-labelledby="ctl-h">
          <h2 id="ctl-h" className={styles.h2}>{doc.name}</h2>
          <p className={styles.model}>
            <a href={model.link} target="_blank" rel="noreferrer">{model.maker} {model.name}</a>
            <span className="mono"> · port {doc.port}</span>
            {code ? <span className="mono"> · {doc.code_name}</span> : null}
          </p>
          <p className={styles.summary}>{doc.summary}</p>

          <h3 className={styles.h3}>Bindings</h3>
          {rows.length ? (
            <ul className={styles.list} aria-label="Bindings">
              {rows.map(({ input, binding }) => (
                <li key={input.id}>
                  <button type="button" className={styles.row} aria-pressed={selected === input.id}
                    onClick={() => select(input.id)}>
                    <kbd className={styles.cap}>{input.short}</kbd>
                    <span className={styles.rowText}>
                      <span className={styles.label}>{binding.label}</span>
                      <span className={styles.action}>{binding.action}</span>
                      {code ? <code className={styles.code}>{binding.code}</code> : null}
                    </span>
                    <span className={styles.how}>{howLabel(binding, input)}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : <p className={styles.empty}>Nothing is bound to this controller yet.</p>}

          {unused.length ? (
            <>
              <h3 className={styles.h3}>Not used</h3>
              <ul className={styles.unused} aria-label="Not used">
                {unused.map((n) => <li key={n.id} title={n.name}>{n.short}</li>)}
              </ul>
            </>
          ) : null}

          {doc.notes.length ? (
            <>
              <h3 className={styles.h3}>Notes</h3>
              <ul className={styles.notes}>{doc.notes.map((n) => <li key={n}>{n}</li>)}</ul>
            </>
          ) : null}

          <p className={styles.updated}>Checked against {data.source} · updated {formatBuilt(data.updated)}</p>
        </section>
      </div>

      <div className={styles.view}>
        <ControllerView model={model} view={view} bindings={bindings} selected={selected} onSelect={select} />
      </div>
    </div>
  );
}
