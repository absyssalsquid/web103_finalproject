export class NotFoundError extends Error {
  constructor(item) {
    super(`${item} not found`);
    this.status = 404;
  }
}

export class PhaseError extends Error {
  constructor(phase_window, curr_phase) {
    super(`Action limited to ${phase_window} phase. It is now ${curr_phase}.`);
    this.status = 403;
  }
}

export class IDError extends Error {
  constructor(num, id_type) {
    super(`Invalid submission ID for ${id_type} ${num}.`);
    this.status = 422;
  }
}