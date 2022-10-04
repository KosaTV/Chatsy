import React from "react";

const MiniTable = ({list, submitTextBtn}) => {
	const handleTableList = e => {
		const item = e.target.closest(".table__item");

		if (item && !e.target.matches(".table__item-checkbox")) {
			const checkbox = item.querySelector("input[type=checkbox]");
			checkbox.checked = !checkbox.checked;
		}
	};

	return (
		<div className="table table--mini">
			<div className="table__list" onClick={handleTableList}>
				{list.map(listItem => {
					return (
						<div key={listItem.id} className="table__item">
							<label className="table__item-label" data-id={listItem.id}>
								{listItem.name}
							</label>
							<input type="checkbox" defaultChecked={listItem.checked} className="table__item-checkbox" />
						</div>
					);
				})}
			</div>
			<button className="button button--secondary popup__button">{submitTextBtn}</button>
		</div>
	);
};

export default MiniTable;
