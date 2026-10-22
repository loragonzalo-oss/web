const formato = new Intl.DateTimeFormat('es-BO', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export function fechaLarga(fecha: Date): string {
  return formato.format(fecha);
}

export function fechaISO(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}
