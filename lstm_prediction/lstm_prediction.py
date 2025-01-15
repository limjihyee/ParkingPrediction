import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping
from sklearn.metrics import mean_squared_error
import os
from datetime import datetime
import math
import time
from termcolor import colored

def print_step(message):
    print(colored(message, 'yellow'))

def timed_step(func):
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        print_step(f"{func.__name__} 실행 시간: {end_time - start_time:.2f}초")
        return result
    return wrapper

@timed_step
def load_processed_data(directory, nodeid):
    filepath = os.path.join(directory, f'{nodeid}', f'{nodeid}.csv')
    print_step(f"Trying to load data from: {filepath}")
    if os.path.exists(filepath):
        data = pd.read_csv(filepath, parse_dates=['datetime'])
        print_step("Data loaded successfully.")
        print(data.head())
        print(data.columns)
        return data
    else:
        raise FileNotFoundError(f"No processed data found for nodeid {nodeid} in {directory}")

@timed_step
def create_dataset(data, time_step=1):
    dataX, dataY = [], []
    for i in range(len(data) - time_step - 1):
        a = data[i:(i + time_step), 0]
        dataX.append(a)
        dataY.append(data[i + time_step, 0])
    return np.array(dataX), np.array(dataY)

@timed_step
def plot_predictions(data, train_predict, test_predict, scaler, time_step):
    data.set_index('datetime', inplace=True)
    data_values = data['speed'].values.reshape(-1, 1)

    train_predict_plot = np.empty_like(data_values)
    train_predict_plot[:, :] = np.nan
    train_predict_plot[time_step:len(train_predict) + time_step, :] = train_predict

    test_predict_plot = np.empty_like(data_values)
    test_predict_plot[:, :] = np.nan
    test_predict_plot[len(train_predict) + (time_step * 2) + 1:len(data_values) - 1, :] = test_predict

    plt.figure(figsize=(18, 8))
    plt.plot(data.index, scaler.inverse_transform(data_values), label='True Data')
    plt.plot(data.index, train_predict_plot, label='Train Predictions')
    plt.plot(data.index, test_predict_plot, label='Test Predictions')
    plt.title('Speed Prediction Using LSTM')
    plt.xlabel('Datetime')
    plt.ylabel('Speed')
    plt.legend()
    plt.grid(True)
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.show()

@timed_step
def calculate_rmse(actual, predicted):
    return math.sqrt(mean_squared_error(actual, predicted))

def main():
    directory = "sources/processed"
    checkpoint_dir = "sources/train/checkpoint"
    model_dir = "sources/model"
    nodeid = input("Enter nodeid: ")

    try:
        data = load_processed_data(directory, nodeid)

        if 'datetime' not in data.columns:
            raise KeyError("The 'datetime' column is not found in the data.")

        data.set_index('datetime', inplace=True)

        scaler = MinMaxScaler(feature_range=(0, 1))
        data['speed'] = scaler.fit_transform(data[['speed']])

        data_values = data['speed'].values
        data_values = data_values.reshape(-1, 1)

        time_step = 10
        X, y = create_dataset(data_values, time_step)

        train_size = int(len(X) * 0.8)
        test_size = len(X) - train_size
        X_train, X_test = X[0:train_size], X[train_size:len(X)]
        y_train, y_test = y[0:train_size], y[train_size:len(y)]

        X_train = X_train.reshape(X_train.shape[0], X_train.shape[1], 1)
        X_test = X_test.reshape(X_test.shape[0], X_test.shape[1], 1)

        checkpoint_path = os.path.join(checkpoint_dir, nodeid)
        if not os.path.exists(checkpoint_path):
            os.makedirs(checkpoint_path)

        model_path = os.path.join(model_dir, nodeid)
        if not os.path.exists(model_path):
            os.makedirs(model_path)

        checkpoint_model_path = os.path.join(checkpoint_path, "model.keras")
        if os.path.exists(checkpoint_model_path):
            model = load_model(checkpoint_model_path)
            print_step("Loaded model from checkpoint.")
        else:
            model = Sequential()
            model.add(LSTM(50, return_sequences=True, input_shape=(time_step, 1)))
            model.add(Dropout(0.2))
            model.add(LSTM(50, return_sequences=False))
            model.add(Dropout(0.2))
            model.add(Dense(50))
            model.compile(optimizer='adam', loss='mean_squared_error')

        checkpoint_callback = ModelCheckpoint(
            filepath=checkpoint_model_path,
            save_weights_only=False,
            save_best_only=True,
            monitor='loss',
            verbose=1
        )

        early_stopping = EarlyStopping(monitor='loss', patience=10, verbose=1)

        model.fit(X_train, y_train, batch_size=1, epochs=10, callbacks=[checkpoint_callback, early_stopping])

        final_model_path = os.path.join(model_path, "model.h5")
        model.save(final_model_path)
        print_step(f"Final model saved to {final_model_path}")

        train_predict = model.predict(X_train)
        test_predict = model.predict(X_test)

        train_predict = scaler.inverse_transform(train_predict)
        y_train = scaler.inverse_transform([y_train])
        test_predict = scaler.inverse_transform(test_predict)
        y_test = scaler.inverse_transform([y_test])

        train_rmse = calculate_rmse(y_train[0], train_predict[:, 0])
        test_rmse = calculate_rmse(y_test[0], test_predict[:, 0])
        print_step(f"Train RMSE: {train_rmse:.2f}")
        print_step(f"Test RMSE: {test_rmse:.2f}")

        info_text_path = os.path.join(model_path, "model_info.txt")
        with open(info_text_path, "w") as file:
            file.write(f"Model saved on: {datetime.now()}\n")
            file.write(f"Train RMSE: {train_rmse:.2f}\n")
            file.write(f"Test RMSE: {test_rmse:.2f}\n")
            file.write(f"Model path: {final_model_path}\n")
        print_step(f"Model information saved to {info_text_path}")

        plot_predictions(data, train_predict, test_predict, scaler, time_step)

    except FileNotFoundError as e:
        print_step(e)
    except KeyError as e:
        print_step(e)

if __name__ == "__main__":
    main()
