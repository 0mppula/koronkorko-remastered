export interface IHasId {
	id: string;
}

export interface IHasFormData<TFormData> extends IHasId {
	formData: TFormData;
}
