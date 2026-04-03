import { createContext, useContext, useState, useCallback } from 'react';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);

  const confirm = useCallback(({ title, message, confirmLabel = '확인', danger = false }) => {
    return new Promise(resolve => {
      setState({ title, message, confirmLabel, danger, resolve });
    });
  }, []);

  function handleConfirm() {
    state?.resolve(true);
    setState(null);
  }

  function handleCancel() {
    state?.resolve(false);
    setState(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className="confirm-dialog" onClick={handleCancel}>
          <div className="confirm-box" onClick={e => e.stopPropagation()}>
            <div className="confirm-title">{state.title}</div>
            <div className="confirm-message">{state.message}</div>
            <div className="confirm-actions">
              <button className="btn btn-ghost" onClick={handleCancel}>취소</button>
              <button
                className={`btn ${state.danger ? 'btn-danger' : 'btn-gold'}`}
                onClick={handleConfirm}
              >
                {state.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  return useContext(ConfirmContext);
}
