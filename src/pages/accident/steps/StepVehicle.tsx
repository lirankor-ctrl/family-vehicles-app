import { useVehicleStore } from '../../../store/VehicleContext';
import { useAccidentStore } from '../../../store/AccidentContext';
import { AccidentCase } from '../../../types';

export default function StepVehicle({ kase, onNext }: { kase: AccidentCase; onNext: () => void }) {
  const { activeVehicles } = useVehicleStore();
  const { selectVehicle } = useAccidentStore();

  const choose = (vehicleId: string) => {
    const v = activeVehicles.find(veh => veh.id === vehicleId);
    if (!v) return;
    selectVehicle(kase.id, v);
    onNext();
  };

  return (
    <div className="accident-step">
      <h1 className="accident-step-title">באיזה רכב היית?</h1>

      {activeVehicles.length === 0 ? (
        <p className="accident-step-question">לא נמצאו רכבים פעילים במערכת. אפשר להמשיך גם בלי לבחור רכב.</p>
      ) : (
        <div className="accident-vehicle-grid">
          {activeVehicles.map(v => (
            <button
              key={v.id}
              className={`accident-vehicle-card ${kase.vehicleId === v.id ? 'selected' : ''}`}
              onClick={() => choose(v.id)}
            >
              {v.photo ? (
                <img src={v.photo} alt="" className="accident-vehicle-photo" />
              ) : (
                <div className="accident-vehicle-photo accident-vehicle-photo-fallback">🚗</div>
              )}
              <div className="accident-vehicle-name">{v.driverName}</div>
              <div className="accident-vehicle-meta">{[v.vehicleType, v.licensePlate].filter(Boolean).join(' · ')}</div>
            </button>
          ))}
        </div>
      )}

      <button className="btn btn-secondary btn-full" style={{ marginTop: 16 }} onClick={onNext}>
        המשך בלי לבחור רכב
      </button>
    </div>
  );
}
